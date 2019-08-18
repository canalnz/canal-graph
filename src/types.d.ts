declare module 'biguint-format' {
  type Format = 'dec' | 'bin' | 'hex' | 'oct';
  interface Options {
    format?: 'BE' | 'LE';
    prefix?: string;
    groupsize?: number;
    delimiter?: string;
    trim?: boolean;
    padstr?: string;
    size?: number;
  }
  namespace intFormat {}
  function intFormat(bignum: Buffer | string | number[], format?: Format, opts?: Options): string;
  export = intFormat;
}
