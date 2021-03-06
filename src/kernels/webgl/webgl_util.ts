/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {ENV} from '../../environment';
import * as util from '../../util';

export function callAndCheck<T>(gl: WebGLRenderingContext, func: () => T): T {
  const returnValue = func();
  checkWebGLError(gl);
  return returnValue;
}

let webGLDebugErrorCheckingEnabled = false;

export function enableDebugWebGLErrorChecking(enabled: boolean) {
  webGLDebugErrorCheckingEnabled = enabled;
}

export function checkWebGLError(gl: WebGLRenderingContext) {
  if (webGLDebugErrorCheckingEnabled) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new Error('WebGL Error: ' + getWebGLErrorMessage(gl, error));
    }
  }
}

export function getWebGLErrorMessage(
    gl: WebGLRenderingContext, status: number): string {
  switch (status) {
    case gl.NO_ERROR:
      return 'NO_ERROR';
    case gl.INVALID_ENUM:
      return 'INVALID_ENUM';
    case gl.INVALID_VALUE:
      return 'INVALID_VALUE';
    case gl.INVALID_OPERATION:
      return 'INVALID_OPERATION';
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return 'INVALID_FRAMEBUFFER_OPERATION';
    case gl.OUT_OF_MEMORY:
      return 'OUT_OF_MEMORY';
    case gl.CONTEXT_LOST_WEBGL:
      return 'CONTEXT_LOST_WEBGL';
    default:
      return `Unknown error code ${status}`;
  }
}

export function getExtensionOrThrow(
    gl: WebGLRenderingContext, extensionName: string): {} {
  return throwIfNull<{}>(
      gl, () => gl.getExtension(extensionName),
      'Extension "' + extensionName + '" not supported on this browser.');
}

export function createVertexShader(
    gl: WebGLRenderingContext, vertexShaderSource: string): WebGLShader {
  const vertexShader: WebGLShader = throwIfNull<WebGLShader>(
      gl, () => gl.createShader(gl.VERTEX_SHADER),
      'Unable to create vertex WebGLShader.');
  callAndCheck(gl, () => gl.shaderSource(vertexShader, vertexShaderSource));
  callAndCheck(gl, () => gl.compileShader(vertexShader));
  if (gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) === false) {
    console.log(gl.getShaderInfoLog(vertexShader));
    throw new Error('Failed to compile vertex shader.');
  }
  return vertexShader;
}

export function createFragmentShader(
    gl: WebGLRenderingContext, fragmentShaderSource: string): WebGLShader {
  const fragmentShader: WebGLShader = throwIfNull<WebGLShader>(
      gl, () => gl.createShader(gl.FRAGMENT_SHADER),
      'Unable to create fragment WebGLShader.');
  callAndCheck(gl, () => gl.shaderSource(fragmentShader, fragmentShaderSource));
  callAndCheck(gl, () => gl.compileShader(fragmentShader));
  if (gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS) === false) {
    logShaderSourceAndInfoLog(
        fragmentShaderSource, gl.getShaderInfoLog(fragmentShader));
    throw new Error('Failed to compile fragment shader.');
  }
  return fragmentShader;
}

const lineNumberRegex = /ERROR: [0-9]+:([0-9]+):/g;
function logShaderSourceAndInfoLog(
    shaderSource: string, shaderInfoLog: string) {
  const lineNumberRegexResult = lineNumberRegex.exec(shaderInfoLog);
  if (lineNumberRegexResult == null) {
    console.log(`Couldn't parse line number in error: ${shaderInfoLog}`);
    console.log(shaderSource);
    return;
  }

  const lineNumber = +lineNumberRegexResult[1];

  const shaderLines = shaderSource.split('\n');
  const pad = shaderLines.length.toString().length + 2;
  const linesWithLineNumbers = shaderLines.map(
      (line, lineNumber) =>
          util.rightPad((lineNumber + 1).toString(), pad) + line);
  let maxLineLength = 0;
  for (let i = 0; i < linesWithLineNumbers.length; i++) {
    maxLineLength = Math.max(linesWithLineNumbers[i].length, maxLineLength);
  }

  const beforeErrorLines = linesWithLineNumbers.slice(0, lineNumber - 1);
  const errorLine = linesWithLineNumbers.slice(lineNumber - 1, lineNumber);
  const afterErrorLines = linesWithLineNumbers.slice(lineNumber);

  console.log(beforeErrorLines.join('\n'));
  console.log(shaderInfoLog.split('\n')[0]);
  console.log(
      `%c ${util.rightPad(errorLine[0], maxLineLength)}`,
      'border:1px solid red; background-color:#e3d2d2; color:#a61717');
  console.log(afterErrorLines.join('\n'));
}

export function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  return throwIfNull<WebGLProgram>(
      gl, () => gl.createProgram(), 'Unable to create WebGLProgram.');
}

export function linkProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
  callAndCheck(gl, () => gl.linkProgram(program));
  if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
    console.log(gl.getProgramInfoLog(program));
    throw new Error('Failed to link vertex and fragment shaders.');
  }
}

export function validateProgram(
    gl: WebGLRenderingContext, program: WebGLProgram) {
  callAndCheck(gl, () => gl.validateProgram(program));
  if (gl.getProgramParameter(program, gl.VALIDATE_STATUS) === false) {
    console.log(gl.getProgramInfoLog(program));
    throw new Error('Shader program validation failed.');
  }
}

export function createStaticVertexBuffer(
    gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer {
  const buffer: WebGLBuffer = throwIfNull<WebGLBuffer>(
      gl, () => gl.createBuffer(), 'Unable to create WebGLBuffer');
  callAndCheck(gl, () => gl.bindBuffer(gl.ARRAY_BUFFER, buffer));
  callAndCheck(gl, () => gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW));
  return buffer;
}

export function createStaticIndexBuffer(
    gl: WebGLRenderingContext, data: Uint16Array): WebGLBuffer {
  const buffer: WebGLBuffer = throwIfNull<WebGLBuffer>(
      gl, () => gl.createBuffer(), 'Unable to create WebGLBuffer');
  callAndCheck(gl, () => gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer));
  callAndCheck(
      gl, () => gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW));
  return buffer;
}

export function getNumChannels(): number {
  if (ENV.get('WEBGL_VERSION') === 2) {
    return 1;
  }
  return 4;
}

export function createTexture(gl: WebGLRenderingContext): WebGLTexture {
  return throwIfNull<WebGLTexture>(
      gl, () => gl.createTexture(), 'Unable to create WebGLTexture.');
}

export function validateTextureSize(width: number, height: number) {
  const maxTextureSize = ENV.get('WEBGL_MAX_TEXTURE_SIZE');
  if ((width <= 0) || (height <= 0)) {
    const requested = `[${width}x${height}]`;
    throw new Error('Requested texture size ' + requested + ' is invalid.');
  }
  if ((width > maxTextureSize) || (height > maxTextureSize)) {
    const requested = `[${width}x${height}]`;
    const max = `[${maxTextureSize}x${maxTextureSize}]`;
    throw new Error(
        'Requested texture size ' + requested +
        ' greater than WebGL maximum on this browser / GPU ' + max + '.');
  }
}

export function createFramebuffer(gl: WebGLRenderingContext): WebGLFramebuffer {
  return throwIfNull<WebGLFramebuffer>(
      gl, () => gl.createFramebuffer(), 'Unable to create WebGLFramebuffer.');
}

export function bindVertexBufferToProgramAttribute(
    gl: WebGLRenderingContext, program: WebGLProgram, attribute: string,
    buffer: WebGLBuffer, arrayEntriesPerItem: number, itemStrideInBytes: number,
    itemOffsetInBytes: number): boolean {
  const loc = gl.getAttribLocation(program, attribute);
  if (loc === -1) {
    // The GPU compiler decided to strip out this attribute because it's unused,
    // thus no need to bind.
    return false;
  }
  callAndCheck(gl, () => gl.bindBuffer(gl.ARRAY_BUFFER, buffer));
  callAndCheck(
      gl,
      () => gl.vertexAttribPointer(
          loc, arrayEntriesPerItem, gl.FLOAT, false, itemStrideInBytes,
          itemOffsetInBytes));
  callAndCheck(gl, () => gl.enableVertexAttribArray(loc));
  return true;
}

export function bindTextureUnit(
    gl: WebGLRenderingContext, texture: WebGLTexture, textureUnit: number) {
  validateTextureUnit(gl, textureUnit);
  callAndCheck(gl, () => gl.activeTexture(gl.TEXTURE0 + textureUnit));
  callAndCheck(gl, () => gl.bindTexture(gl.TEXTURE_2D, texture));
}

export function unbindTextureUnit(
    gl: WebGLRenderingContext, textureUnit: number) {
  validateTextureUnit(gl, textureUnit);
  callAndCheck(gl, () => gl.activeTexture(gl.TEXTURE0 + textureUnit));
  callAndCheck(gl, () => gl.bindTexture(gl.TEXTURE_2D, null));
}

export function getProgramUniformLocationOrThrow(
    gl: WebGLRenderingContext, program: WebGLProgram,
    uniformName: string): WebGLUniformLocation {
  return throwIfNull<WebGLUniformLocation>(
      gl, () => gl.getUniformLocation(program, uniformName),
      'uniform "' + uniformName + '" not present in program.');
}

export function getProgramUniformLocation(
    gl: WebGLRenderingContext, program: WebGLProgram,
    uniformName: string): WebGLUniformLocation {
  return gl.getUniformLocation(program, uniformName);
}

export function bindTextureToProgramUniformSampler(
    gl: WebGLRenderingContext, program: WebGLProgram, texture: WebGLTexture,
    uniformSamplerLocation: WebGLUniformLocation, textureUnit: number) {
  callAndCheck(gl, () => bindTextureUnit(gl, texture, textureUnit));
  callAndCheck(gl, () => gl.uniform1i(uniformSamplerLocation, textureUnit));
}

export function bindCanvasToFramebuffer(gl: WebGLRenderingContext) {
  callAndCheck(gl, () => gl.bindFramebuffer(gl.FRAMEBUFFER, null));
  callAndCheck(gl, () => gl.viewport(0, 0, gl.canvas.width, gl.canvas.height));
  callAndCheck(gl, () => gl.scissor(0, 0, gl.canvas.width, gl.canvas.height));
}

export function bindColorTextureToFramebuffer(
    gl: WebGLRenderingContext, texture: WebGLTexture,
    framebuffer: WebGLFramebuffer) {
  callAndCheck(gl, () => gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer));
  callAndCheck(
      gl,
      () => gl.framebufferTexture2D(
          gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0));
}

export function unbindColorTextureFromFramebuffer(
    gl: WebGLRenderingContext, framebuffer: WebGLFramebuffer) {
  callAndCheck(gl, () => gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer));
  callAndCheck(
      gl,
      () => gl.framebufferTexture2D(
          gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0));
}

export function validateFramebuffer(gl: WebGLRenderingContext) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(
        'Error binding framebuffer: ' + getFramebufferErrorMessage(gl, status));
  }
}

export function getFramebufferErrorMessage(
    gl: WebGLRenderingContext, status: number): string {
  switch (status) {
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
    case gl.FRAMEBUFFER_UNSUPPORTED:
      return 'FRAMEBUFFER_UNSUPPORTED';
    default:
      return `unknown error ${status}`;
  }
}

function throwIfNull<T>(
    gl: WebGLRenderingContext, returnTOrNull: () => T | null,
    failureMessage: string): T {
  const tOrNull: T|null = callAndCheck(gl, () => returnTOrNull());
  if (tOrNull == null) {
    throw new Error(failureMessage);
  }
  return tOrNull as T;
}

function validateTextureUnit(gl: WebGLRenderingContext, textureUnit: number) {
  const maxTextureUnit = gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1;
  const glTextureUnit = textureUnit + gl.TEXTURE0;
  if (glTextureUnit < gl.TEXTURE0 || glTextureUnit > maxTextureUnit) {
    const textureUnitRange = `[gl.TEXTURE0, gl.TEXTURE${maxTextureUnit}]`;
    throw new Error(`textureUnit must be in ${textureUnitRange}.`);
  }
}

export function getTextureShapeFromLogicalShape(
    logShape: number[], isPacked = false): [number, number] {
  let maxTexSize = ENV.get('WEBGL_MAX_TEXTURE_SIZE');
  if (isPacked) {
    maxTexSize = maxTexSize * 2;

    // This logic ensures we accurately count the number of packed texels needed
    // to accommodate the tensor. We can only pack values in the same texel if
    // they are from adjacent pairs of rows/cols within the same batch. So if a
    // tensor has 3 rows, we pretend it has 4 rows in order to account for the
    // fact that the texels containing the third row are half empty.
    logShape = logShape.map(
        (d, i) => i >= logShape.length - 2 ?
            util.nearestLargerEven(logShape[i]) :
            logShape[i]);
  }

  // If logical shape is 2, we don't squeeze, since we want to match physical.
  if (logShape.length !== 2) {
    const squeezeResult = util.squeezeShape(logShape);
    logShape = squeezeResult.newShape;
  }

  const size = util.sizeFromShape(logShape);
  if (logShape.length <= 1 && size <= maxTexSize) {
    return [size, 1];
  } else if (
      logShape.length === 2 && logShape[0] <= maxTexSize &&
      logShape[1] <= maxTexSize) {
    return logShape as [number, number];
  } else if (
      logShape.length === 3 && logShape[0] * logShape[1] <= maxTexSize &&
      logShape[2] <= maxTexSize) {
    return [logShape[0] * logShape[1], logShape[2]];
  } else if (
      logShape.length === 3 && logShape[0] <= maxTexSize &&
      logShape[1] * logShape[2] <= maxTexSize) {
    return [logShape[0], logShape[1] * logShape[2]];
  } else if (
      logShape.length === 4 &&
      logShape[0] * logShape[1] * logShape[2] <= maxTexSize &&
      logShape[3] <= maxTexSize) {
    return [logShape[0] * logShape[1] * logShape[2], logShape[3]];
  } else if (
      logShape.length === 4 && logShape[0] <= maxTexSize &&
      logShape[1] * logShape[2] * logShape[3] <= maxTexSize) {
    return [logShape[0], logShape[1] * logShape[2] * logShape[3]];
  } else {
    return util.sizeToSquarishShape(size);
  }
}

function isEven(n: number): boolean {
  return n % 2 === 0;
}

/**
 * This determines whether reshaping a packed texture requires rearranging
 * the data within the texture, assuming 2x2 packing.
 */
export function isReshapeFree(shape1: number[], shape2: number[]): boolean {
  shape1 = shape1.slice(-2);
  shape2 = shape2.slice(-2);

  if (util.arraysEqual(shape1, shape2)) {
    return true;
  }

  if (!shape1.length || !shape2.length) {  // One of the shapes is a scalar.
    return true;
  }

  if (shape1[0] === 0 || shape1[1] === 0 || shape2[0] === 0 ||
      shape2[1] === 0) {
    return true;
  }

  if (shape1.length !== shape2.length) {  // One of the shapes is a vector.
    if (util.arraysEqual(
            util.squeezeShape(shape1).newShape,
            util.squeezeShape(shape2).newShape)) {
      return true;
    }
  } else {
    if (isEven(shape1[0]) && isEven(shape2[0])) {
      if (isEven(shape1[1]) && isEven(shape2[1])) {
        return true;
      }
      if (shape1[1] === shape2[1]) {
        return true;
      }
    }
  }

  return false;
}