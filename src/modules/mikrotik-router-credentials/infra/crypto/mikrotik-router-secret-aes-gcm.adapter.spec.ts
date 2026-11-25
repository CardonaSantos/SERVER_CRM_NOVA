import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

import { MikrotikCryptoService } from 'src/ssh-mikrotik-connection/helpers/mikrotik-crypto.service';

import { MikrotikRouterSecretAesGcmAdapter } from './mikrotik-router-secret-aes-gcm.adapter';

const CLAVE_V1 = randomBytes(32).toString('base64');
const CLAVE_V2 = randomBytes(32).toString('base64');
const CLAVE_LEGACY = 'clave-legacy-de-al-menos-32-caracteres!!';

function crearAdaptador(entorno: Record<string, string | undefined>) {
  const config = { get: (clave: string) => entorno[clave] } as ConfigService;
  return new MikrotikRouterSecretAesGcmAdapter(config);
}

function leerSobre(cifrado: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cifrado, 'base64').toString('utf8'));
}

describe('MikrotikRouterSecretAesGcmAdapter', () => {
  const entornoBase = {
    MIKROTIK_ROUTER_SECRET_KEY_V1: CLAVE_V1,
    MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION: '1',
  };

  it('cifra y descifra conservando la contraseña exacta (incluidos espacios)', async () => {
    const adaptador = crearAdaptador(entornoBase);
    const contrasena = '  P@ss wörd con espacios  ';

    const cifrado = await adaptador.encrypt(contrasena);

    expect(cifrado).not.toContain('P@ss');
    expect(await adaptador.decrypt(cifrado)).toBe(contrasena);
  });

  it('usa IV aleatorio: dos cifrados de lo mismo son distintos', async () => {
    const adaptador = crearAdaptador(entornoBase);

    const a = await adaptador.encrypt('secreto');
    const b = await adaptador.encrypt('secreto');

    expect(a).not.toBe(b);
    expect(leerSobre(a)).toMatchObject({
      formato: 'MIKROTIK_ROUTER_AES_GCM',
      versionFormato: 1,
      versionClave: 1,
    });
  });

  it('rota la clave: cifra con la activa y sigue descifrando las anteriores', async () => {
    const conV1 = await crearAdaptador(entornoBase).encrypt('viejo');

    const rotado = crearAdaptador({
      ...entornoBase,
      MIKROTIK_ROUTER_SECRET_KEY_V2: CLAVE_V2,
      MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION: '2',
    });

    const conV2 = await rotado.encrypt('nuevo');

    expect(leerSobre(conV2).versionClave).toBe(2);
    expect(await rotado.decrypt(conV1)).toBe('viejo');
    expect(await rotado.decrypt(conV2)).toBe('nuevo');
  });

  it('falla si falta la clave de la versión del sobre', async () => {
    const conV1 = await crearAdaptador(entornoBase).encrypt('x');

    const sinV1 = crearAdaptador({
      MIKROTIK_ROUTER_SECRET_KEY_V2: CLAVE_V2,
      MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION: '2',
    });

    await expect(sinV1.decrypt(conV1)).rejects.toThrow(/versión 1/);
  });

  it('detecta manipulación del texto cifrado sin revelar la contraseña', async () => {
    const adaptador = crearAdaptador(entornoBase);
    const sobre = leerSobre(await adaptador.encrypt('mi-secreto-real'));

    const bytes = Buffer.from(sobre.ciphertext as string, 'base64');
    bytes[0] ^= 0xff;
    sobre.ciphertext = bytes.toString('base64');

    const manipulado = Buffer.from(JSON.stringify(sobre)).toString('base64');

    const error = await adaptador.decrypt(manipulado).catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/No fue posible descifrar/);
    expect((error as Error).message).not.toContain('mi-secreto-real');
  });

  it('descifra credenciales legacy de MikrotikCryptoService', async () => {
    const legacy = new MikrotikCryptoService({
      get: () => CLAVE_LEGACY,
    } as unknown as ConfigService);

    const cifradoLegacy = legacy.encrypt('admin-legacy');

    const adaptador = crearAdaptador({
      ...entornoBase,
      MIKROTIK_SECRET_KEY: CLAVE_LEGACY,
    });

    expect(await adaptador.decrypt(cifradoLegacy)).toBe('admin-legacy');
  });

  it('una credencial legacy sin MIKROTIK_SECRET_KEY falla con un error claro', async () => {
    const legacy = new MikrotikCryptoService({
      get: () => CLAVE_LEGACY,
    } as unknown as ConfigService);

    await expect(
      crearAdaptador(entornoBase).decrypt(legacy.encrypt('x')),
    ).rejects.toThrow(/MIKROTIK_SECRET_KEY no está configurada/);
  });

  it('rechaza contraseñas vacías, demasiado largas y configuración inválida', async () => {
    const adaptador = crearAdaptador(entornoBase);

    await expect(adaptador.encrypt('')).rejects.toThrow(/obligatoria/);
    await expect(adaptador.encrypt('x'.repeat(1_001))).rejects.toThrow(
      /longitud/,
    );
    await expect(adaptador.decrypt('  ')).rejects.toThrow(/obligatoria/);
    await expect(adaptador.decrypt('no es base64!')).rejects.toThrow(/Base64/);

    await expect(
      crearAdaptador({
        ...entornoBase,
        MIKROTIK_ROUTER_SECRET_ACTIVE_KEY_VERSION: 'cero',
      }).encrypt('x'),
    ).rejects.toThrow(/entero positivo/);

    await expect(
      crearAdaptador({
        MIKROTIK_ROUTER_SECRET_KEY_V1: Buffer.from('corta').toString('base64'),
      }).encrypt('x'),
    ).rejects.toThrow(/32 bytes/);
  });
});
