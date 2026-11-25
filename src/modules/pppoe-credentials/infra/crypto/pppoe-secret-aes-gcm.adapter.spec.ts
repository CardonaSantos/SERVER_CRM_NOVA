import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

import { PppoeSecretAesGcmAdapter } from './pppoe-secret-aes-gcm.adapter';

const CLAVE_V1 = randomBytes(32).toString('base64');
const CLAVE_V2 = randomBytes(32).toString('base64');

function crearAdaptador(entorno: Record<string, string | undefined>) {
  const config = { get: (clave: string) => entorno[clave] } as ConfigService;
  return new PppoeSecretAesGcmAdapter(config);
}

describe('PppoeSecretAesGcmAdapter', () => {
  const entornoBase = {
    PPPOE_SECRET_KEY_V1: CLAVE_V1,
    PPPOE_SECRET_ACTIVE_KEY_VERSION: '1',
  };

  it('cifra y descifra; el material guardado no contiene el secreto', async () => {
    const adaptador = crearAdaptador(entornoBase);

    const protegido = await adaptador.encrypt('NV-2026/11/24MH18:36#');

    expect(protegido.versionClave).toBe(1);
    expect(JSON.stringify(protegido)).not.toContain('NV-2026');
    expect(await adaptador.decrypt(protegido)).toBe('NV-2026/11/24MH18:36#');
  });

  it('recorta espacios al cifrar (comportamiento actual)', async () => {
    const adaptador = crearAdaptador(entornoBase);

    const protegido = await adaptador.encrypt('  secreto  ');

    expect(await adaptador.decrypt(protegido)).toBe('secreto');
  });

  it('usa IV aleatorio', async () => {
    const adaptador = crearAdaptador(entornoBase);

    const a = await adaptador.encrypt('mismo');
    const b = await adaptador.encrypt('mismo');

    expect(a.secretoIv).not.toBe(b.secretoIv);
    expect(a.secretoCifrado).not.toBe(b.secretoCifrado);
  });

  it('rota la clave y sigue descifrando las versiones anteriores', async () => {
    const conV1 = await crearAdaptador(entornoBase).encrypt('viejo');

    const rotado = crearAdaptador({
      ...entornoBase,
      PPPOE_SECRET_KEY_V2: CLAVE_V2,
      PPPOE_SECRET_ACTIVE_KEY_VERSION: '2',
    });
    const conV2 = await rotado.encrypt('nuevo');

    expect(conV2.versionClave).toBe(2);
    expect(await rotado.decrypt(conV1)).toBe('viejo');
    expect(await rotado.decrypt(conV2)).toBe('nuevo');
  });

  it('detecta manipulación (auth tag) sin revelar el secreto', async () => {
    const adaptador = crearAdaptador(entornoBase);
    const protegido = await adaptador.encrypt('secreto-real');

    const tag = Buffer.from(protegido.secretoAuthTag, 'base64');
    tag[0] ^= 0xff;

    const error = await adaptador
      .decrypt({ ...protegido, secretoAuthTag: tag.toString('base64') })
      .catch((e: Error) => e);

    expect((error as Error).message).toBe(
      'No fue posible descifrar el secreto PPPoE.',
    );
  });

  it('rechaza entradas y configuración inválidas', async () => {
    const adaptador = crearAdaptador(entornoBase);
    const protegido = await adaptador.encrypt('x');

    await expect(adaptador.encrypt('   ')).rejects.toThrow(/obligatorio/);
    await expect(
      adaptador.decrypt({ ...protegido, versionClave: 0 }),
    ).rejects.toThrow(/versión de clave/);
    await expect(
      adaptador.decrypt({ ...protegido, secretoIv: 'AAAA' }),
    ).rejects.toThrow(/IV/);
    await expect(crearAdaptador({}).decrypt(protegido)).rejects.toThrow(
      /versión 1/,
    );
    await expect(
      crearAdaptador({
        PPPOE_SECRET_KEY_V1: Buffer.from('corta').toString('base64'),
      }).encrypt('x'),
    ).rejects.toThrow(/32 bytes/);
  });
});
