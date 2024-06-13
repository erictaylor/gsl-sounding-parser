<h1 align="center">gsl-sounding-parser</h1>

<p align="center">
  A parser for NOAA GSL sounding reports.
</p>

<p align="center">
<a href="https://jsr.io/@erictaylor/gsl-sounding-parser">
  <img src="https://jsr.io/badges/@erictaylor/gsl-sounding-parser" alt="" />
</a>
<a href="https://jsr.io/@erictaylor/gsl-sounding-parser">
  <img src="https://jsr.io/badges/@erictaylor/gsl-sounding-parser/score" alt="" />
</a>
</p>

<br />

## Installation

> [!NOTE]
>
> This library is an ESM _only_ package. No CJS version is available.

#### NPM:

```sh
npm i gsl-sounding-parser
# or
npx jsr add @erictaylor/gsl-sounding-parser
```

#### Yarn:

```sh
yarn add gsl-sounding-parser
# or
yarn dlx jsr add @erictaylor/gsl-sounding-parser
```

#### PNPM:

```sh
pnpm add gsl-sounding-parser
# or
pnp dlx jsr add @erictaylor/gsl-sounding-parser
```

#### Bun:

```sh
bun add gsl-sounding-parser
# or
bux jsr add @erictaylor/gsl-sounding-parser
```

#### Deno:

```sh
deno add @erictaylor/gsl-sounding-parser
```

## Usage

```ts
import { parse } from 'gsl-sounding-parser';

const soundingReports = parse(gsdString);
```

## Resources

- [RUC Soundings](https://rucsoundings.noaa.gov/)
- [GSD Sounding Format](https://rucsoundings.noaa.gov/raob_format.html)


## License

[MIT](/LICENSE.md) © [Eric Taylor](https://github.com/erictaylor)