/**
 * Barrel de contenido que estaba ESCRITO pero SIN CONECTAR al juego.
 * (gameContentExtra4-19 y gameContentMega1-7 no los importaba nadie.)
 *
 * Aquí se agrupan por tipo para engancharlos en useGameContent.ts.
 * Si algún export cambia de nombre, el error de tipos sale AQUÍ y se
 * arregla en un solo sitio.
 */
import { yoNuncaExtra4 } from './gameContentExtra4';
import { quienEsMasProbableExtra5, clasicoExtra5, picanteExtra5 } from './gameContentExtra5';
import { pacoversExtra6, quienEsMasProbableExtra6 } from './gameContentExtra6';
import { espanaExtra7, picanteExtra7 } from './gameContentExtra7';
import { yoNuncaExtra8 } from './gameContentExtra8';
import { clasicoExtra9 } from './gameContentExtra9';
import {
  yoNuncaExtra10, quienEsMasProbableExtra10, clasicoExtra10,
  picanteExtra10, pacoversExtra10, enLaCamaYExtra10,
} from './gameContentExtra10';
import {
  yoNuncaExtra11, picanteExtra11, picanteExtra11b, picanteExtra11c,
  pacoversExtra11, pacoversExtra11b, pacoversExtra11c,
  clasicoExtra11, clasicoExtra11b, clasicoExtra11c,
  votacionExtra11, votacionExtra11b, votacionExtra11c,
  mimicaExtra11, mimicaExtra11b, mimicaExtra11c,
  verdadOBebeExtra, cadenaExtra, salseoExtra,
} from './gameContentExtra11';
import { yoNuncaExtra12, picanteExtra12, retosExtra12, votacionExtra12 } from './gameContentExtra12';
import { verdadOBebeExtra12, categoriasExtra12, cadenaExtra12, pacoversExtra12 } from './gameContentExtra12b';
import {
  yoNuncaExtra14, picanteExtra14, retosExtra14, votacionExtra14, cadenaExtra14, verdadOBebeExtra14,
} from './gameContentExtra14';
import { votacionExtra15, verdadOBebeExtra15 } from './gameContentExtra15';
import { retosExtra16, cadenaExtra16, categoriasExtra16, mimicaExtra16 } from './gameContentExtra16';
import { salseoExtra17, clasicoExtra17, picanteExtra17 } from './gameContentExtra17';
import { yoNuncaExtra18, votacionExtra18, verdadOBebeExtra18 } from './gameContentExtra18';
import { retosExtra19, torneoRetos } from './gameContentExtra19';
import { yoNuncaInfancia } from './gameContentMega1';
import { yoNuncaInstituto } from './gameContentMega2';
import { yoNuncaUniversidad } from './gameContentMega3';
import { yoNuncaCurro } from './gameContentMega4';
import { yoNuncaFiesta, picanteNuevo } from './gameContentMega5';
import { votacionNuevo, verdadOBebeNuevo } from './gameContentMega6';
import {
  retosNuevo, cadenaNuevo, categoriasNuevo, normasNuevas,
  mimicaNueva, enLaCamaNuevo, pacoversEspanaNuevo,
} from './gameContentMega7';

const yn = (arr: string[]) => arr.map(s => (/^yo nunca/i.test(s.trim()) ? s : `Yo nunca ${s}`));

export const moreYoNunca: string[] = [
  ...yoNuncaExtra4, ...yoNuncaExtra8, ...yoNuncaExtra10, ...yoNuncaExtra11,
  ...yoNuncaExtra12, ...yoNuncaExtra14, ...yoNuncaExtra18,
  ...yn(yoNuncaInfancia), ...yn(yoNuncaInstituto), ...yn(yoNuncaUniversidad),
  ...yn(yoNuncaCurro), ...yn(yoNuncaFiesta),
];

export const morePicante: string[] = [
  ...picanteExtra5, ...picanteExtra7, ...picanteExtra10,
  ...picanteExtra11, ...picanteExtra11b, ...picanteExtra11c,
  ...picanteExtra12, ...picanteExtra14, ...picanteExtra17, ...picanteNuevo,
];

export const moreVotacion: string[] = [
  ...quienEsMasProbableExtra5, ...quienEsMasProbableExtra6, ...quienEsMasProbableExtra10,
  ...votacionExtra11, ...votacionExtra11b, ...votacionExtra11c,
  ...votacionExtra12, ...votacionExtra14, ...votacionExtra15, ...votacionExtra18, ...votacionNuevo,
];

export const moreClasico: string[] = [
  ...clasicoExtra5, ...clasicoExtra9, ...clasicoExtra10,
  ...clasicoExtra11, ...clasicoExtra11b, ...clasicoExtra11c, ...clasicoExtra17,
  ...categoriasExtra12, ...categoriasExtra16, ...categoriasNuevo,
  ...retosExtra12, ...retosExtra14, ...retosExtra16, ...retosExtra19, ...retosNuevo,
  ...verdadOBebeExtra, ...verdadOBebeExtra12, ...verdadOBebeExtra14,
  ...verdadOBebeExtra15, ...verdadOBebeExtra18, ...verdadOBebeNuevo,
  ...cadenaExtra, ...cadenaExtra12, ...cadenaExtra14, ...cadenaExtra16, ...cadenaNuevo,
];

export const moreEspana: string[] = [
  ...espanaExtra7, ...pacoversExtra6, ...pacoversExtra10,
  ...pacoversExtra11, ...pacoversExtra11b, ...pacoversExtra11c, ...pacoversExtra12,
  ...pacoversEspanaNuevo,
];

export const moreEnLaCama: string[] = [...enLaCamaYExtra10, ...enLaCamaNuevo];

export const moreNormas: string[] = [...normasNuevas];

export const moreMimica: string[] = [
  ...mimicaExtra11, ...mimicaExtra11b, ...mimicaExtra11c, ...mimicaExtra16, ...mimicaNueva,
];

export const moreSalseo: string[] = [...salseoExtra, ...salseoExtra17];

export const moreTorneoRetos: string[] = [...torneoRetos, ...retosExtra19];
