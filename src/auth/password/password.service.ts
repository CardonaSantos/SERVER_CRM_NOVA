import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import * as bcrypt from 'bcryptjs';

import { PasswordHasherPort } from 'src/user/domain/ports/password-hasher.port';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/*
 * Parámetros vigentes (D9): N=2^17, r=8, p=1 → ~128 MiB por cálculo.
 * Cambiarlos aquí hace que needsRehash() migre cada hash en el próximo
 * login, sin que nadie cambie su contraseña.
 */
const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const LONGITUD_CLAVE = 64;
const LONGITUD_SAL = 16;
// scrypt exige maxmem > 128 * N * r; margen para el overhead interno.
const MAXMEM = 256 * 1024 * 1024;

const PREFIJO_SCRYPT = '$scrypt$';
const PREFIJO_BCRYPT = /^\$2[aby]\$/;

interface HashScrypt {
  N: number;
  r: number;
  p: number;
  sal: Buffer;
  clave: Buffer;
}

/**
 * Hash y verificación de contraseñas de usuarios del CRM.
 *
 * Formato: $scrypt$N=131072,r=8,p=1$<sal base64>$<clave base64>
 * Acepta también hashes bcrypt ($2a$/$2b$/$2y$) heredados: se verifican
 * con bcrypt y needsRehash() los marca para migrar a scrypt.
 */
@Injectable()
export class PasswordService implements PasswordHasherPort {
  async hash(contrasena: string): Promise<string> {
    const sal = randomBytes(LONGITUD_SAL);
    const clave = await scrypt(contrasena, sal, LONGITUD_CLAVE, {
      ...PARAMS,
      maxmem: MAXMEM,
    });

    return (
      `${PREFIJO_SCRYPT}N=${PARAMS.N},r=${PARAMS.r},p=${PARAMS.p}` +
      `$${sal.toString('base64')}$${clave.toString('base64')}`
    );
  }

  /** Alias de verify() para cumplir PasswordHasherPort. */
  compare(contrasena: string, hashGuardado: string): Promise<boolean> {
    return this.verify(contrasena, hashGuardado);
  }

  /**
   * true si la contraseña corresponde al hash. Nunca lanza: un hash
   * corrupto o desconocido se trata como contraseña incorrecta.
   */
  async verify(contrasena: string, hashGuardado: string): Promise<boolean> {
    if (typeof contrasena !== 'string' || typeof hashGuardado !== 'string') {
      return false;
    }

    try {
      if (hashGuardado.startsWith(PREFIJO_SCRYPT)) {
        const h = this.parsear(hashGuardado);
        if (!h) return false;

        const calculada = await scrypt(contrasena, h.sal, h.clave.length, {
          N: h.N,
          r: h.r,
          p: h.p,
          maxmem: MAXMEM,
        });

        return (
          calculada.length === h.clave.length &&
          timingSafeEqual(calculada, h.clave)
        );
      }

      if (PREFIJO_BCRYPT.test(hashGuardado)) {
        return await bcrypt.compare(contrasena, hashGuardado);
      }

      return false;
    } catch {
      return false;
    }
  }

  /** true si el hash es bcrypt o scrypt con parámetros distintos a los vigentes. */
  needsRehash(hashGuardado: string): boolean {
    const h = this.parsear(hashGuardado);

    return (
      !h ||
      h.N !== PARAMS.N ||
      h.r !== PARAMS.r ||
      h.p !== PARAMS.p ||
      h.clave.length !== LONGITUD_CLAVE
    );
  }

  private parsear(hashGuardado: string): HashScrypt | null {
    if (typeof hashGuardado !== 'string') return null;
    if (!hashGuardado.startsWith(PREFIJO_SCRYPT)) return null;

    const [params, salB64, claveB64] = hashGuardado
      .slice(PREFIJO_SCRYPT.length)
      .split('$');

    const m = /^N=(\d+),r=(\d+),p=(\d+)$/.exec(params ?? '');
    if (!m || !salB64 || !claveB64) return null;

    const sal = Buffer.from(salB64, 'base64');
    const clave = Buffer.from(claveB64, 'base64');
    if (sal.length === 0 || clave.length === 0) return null;

    return { N: Number(m[1]), r: Number(m[2]), p: Number(m[3]), sal, clave };
  }
}
