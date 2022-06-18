/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import tinycolor from 'tinycolor2';
import { RGBA } from './types';

export const round = (num: number, precision = 0) =>
  Number(`${Math.round(Number(`${num}e+${precision}`))}e-${precision}`);

const rgbRegex = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/;
export function getContrastingColor(color: string, thresholds = 186) {
  let r = 0;
  let g = 0;
  let b = 0;
  if (color.length > 7) {
    // rgb
    const matchColor = rgbRegex.exec(color);
    if (!matchColor) {
      throw new Error(`Invalid color: ${color}`);
    }
    r = parseInt(matchColor[1], 10);
    g = parseInt(matchColor[2], 10);
    b = parseInt(matchColor[3], 10);
  } else {
    // hex
    let hex = color;
    if (hex.startsWith('#')) {
      hex = hex.substring(1);
    }
    // #FFF
    if (hex.length === 3) {
      hex = [hex[0], hex[0], hex[1], hex[1], hex[2], hex[2]].join('');
    }
    if (hex.length !== 6) {
      throw new Error(`Invalid color: ${color}`);
    }
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }

  return r * 0.299 + g * 0.587 + b * 0.114 > thresholds ? '#000' : '#FFF';
}

export function getAnalogousColors(colors: string[], results: number) {
  const generatedColors: string[] = [];
  // This is to solve the problem that the first three values generated by tinycolor.analogous
  // may have the same or very close colors.
  const ext = 3;
  const analogousColors = colors.map(color => {
    const result = tinycolor(color).analogous(results + ext);
    return result.slice(ext);
  });

  // [[A, AA, AAA], [B, BB, BBB]] => [A, B, AA, BB, AAA, BBB]
  while (analogousColors[analogousColors.length - 1]?.length) {
    analogousColors.forEach(colors => {
      const color = colors.shift() as tinycolor.Instance;
      generatedColors.push(color.toHexString());
    });
  }

  return generatedColors;
}

export function addAlpha(color: string, opacity: number): string {
  // opacity value should be between 0 and 1.
  if (opacity > 1 || opacity < 0) {
    throw new Error(`The opacity should between 0 and 1, but got: ${opacity}`);
  }
  // the alpha value is between 00 - FF
  const alpha = `0${Math.round(opacity * 255)
    .toString(16)
    .toUpperCase()}`.slice(-2);

  return `${color}${alpha}`;
}

export function isValidHexColor(color: string | undefined): boolean {
  // matches with or without leading hash, short or long, with or without alpha
  if (typeof color !== 'string') {
    return false;
  }
  return (
    (color || '')
      .toUpperCase()
      .match(
        /^#?[0-9A-F]{6}$|^#?[0-9A-F]{8}$|^#?[0-9A-F]{3}$|^#?[0-9A-F]{4}$/,
      ) !== null
  );
}

export function rgbToHex(red: number, green: number, blue: number) {
  let r = red.toString(16);
  let g = green.toString(16);
  let b = blue.toString(16);

  if (r.length === 1) r = `0${r}`;
  if (g.length === 1) g = `0${g}`;
  if (b.length === 1) b = `0${b}`;

  return `#${r}${g}${b}`.toUpperCase();
}

export function toRgbaHex(color: string | RGBA | undefined): string {
  if (isValidHexColor(color)) {
    return color;
  }
  // else assume it's RGBA?
  const { r = 0, g = 0, b = 0, a = 1 } = color || {};
  return addAlpha(rgbToHex(r, g, b), a);
}

export function splitRgbAlpha(color: string | undefined):
  | {
      rgb: string;
      alpha: number;
    }
  | undefined {
  if (isValidHexColor(color)) {
    let hex = color;
    let prefix = '';
    if (hex.startsWith('#')) {
      hex = hex.substring(1);
      prefix = '#';
    }
    if (hex.length === 8) {
      return {
        rgb: `${prefix}${hex.slice(0, -2)}`,
        alpha: round(parseInt(hex.slice(-2), 16) / 255, 2),
      };
    }
    if (hex.length === 4) {
      return {
        rgb: `${prefix}${hex.slice(0, -1)}`,
        alpha: round(parseInt(hex.slice(-1) + hex.slice(-1), 16) / 255, 2),
      };
    }
    if (hex.length === 3 || hex.length === 6) {
      return {
        rgb: `${prefix}${hex}`,
        alpha: undefined,
      };
    }
  }
  return undefined;
}
