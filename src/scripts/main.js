const mat4 = {};
mat4.create = require('gl-mat4').create;
mat4.lookAt = require('gl-mat4').lookAt;
mat4.perspective = require('gl-mat4').perspective;
mat4.rotateX = require('gl-mat4').rotateX;
mat4.rotateY = require('gl-mat4').rotateY;
mat4.rotateZ = require('gl-mat4').rotateZ;

const MAX_ROTATION_SPEED = 0.025;
const canvas = document.getElementById('game');
const gl = canvas.getContext('webgl');

let rotationSpeedHash = generateRotationSpeedHash();

['touchend', 'mouseup'].forEach((eventName) => {
  canvas.addEventListener(eventName, () => {
    rotationSpeedHash = generateRotationSpeedHash();
  });
});

canvas.width = 200;
canvas.height = 200;

const VERTEX_SHADER = `attribute vec3 position;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  void main() {
   gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1);
  }`;

const FRAGMENT_SHADER = `#ifdef GL_ES
  precision mediump float;
  #endif
  void main() {
   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }`;

const UNIFORM_NAMES = [
  'modelMatrix',
  'viewMatrix',
  'projectionMatrix'
];

const VERTICES = new Float32Array([
  // Front face
  -1.0, -1.0,  1.0,
  1.0, -1.0,  1.0,

  1.0, -1.0,  1.0,
  1.0,  1.0,  1.0,

  1.0,  1.0,  1.0,
  -1.0,  1.0,  1.0,

  -1.0,  1.0,  1.0,
  -1.0, -1.0,  1.0,


  // Back face
  -1.0, -1.0, -1.0,
  -1.0,  1.0, -1.0,

  -1.0,  1.0, -1.0,
  1.0,  1.0, -1.0,

  1.0,  1.0, -1.0,
  1.0, -1.0, -1.0,

  1.0, -1.0, -1.0,
  -1.0, -1.0, -1.0,


  // Top face
  -1.0,  1.0, -1.0,
  -1.0,  1.0,  1.0,

  -1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,

  1.0,  1.0,  1.0,
  1.0,  1.0, -1.0,

  1.0,  1.0, -1.0,
  -1.0,  1.0, -1.0,


  // Bottom face
  -1.0, -1.0, -1.0,
  1.0, -1.0, -1.0,

  1.0, -1.0, -1.0,
  1.0, -1.0,  1.0,

  1.0, -1.0,  1.0,
  -1.0, -1.0,  1.0,

  -1.0, -1.0,  1.0,
  -1.0, -1.0, -1.0
]);


const modelMatrix = newModelMatrix();
const viewMatrix = newViewMatrix();
const projectionMatrix = newProjectionMatrix();
const program = programFromCompiledShadersAndUniformNames(
  gl,
  VERTEX_SHADER,
  FRAGMENT_SHADER,
  UNIFORM_NAMES
);

gl.useProgram(program);
gl.uniformMatrix4fv(program.uniformsCache['modelMatrix'], false, modelMatrix);
gl.uniformMatrix4fv(program.uniformsCache['viewMatrix'], false, viewMatrix);
gl.uniformMatrix4fv(program.uniformsCache['projectionMatrix'], false, projectionMatrix);
configureVerticesForCube(gl, program, VERTICES);

drawCube();
requestAnimationFrame(animateCube);

function animateCube() {
  rotateCube(modelMatrix, rotationSpeedHash);
  drawCube();
  requestAnimationFrame(animateCube);
}

function drawCube() {
  gl.uniformMatrix4fv(program.uniformsCache['modelMatrix'], false, modelMatrix);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.drawArrays(gl.LINES, 0, VERTICES.length / 3);
}

function generateRotationSpeedHash() {
  return {
    x: randomFloatBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED),
    y: randomFloatBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED),
    z: randomFloatBetween(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED)
  };
}

function rotateCube(modelMatrix, rotationSpeedHash) {
  mat4.rotateX(modelMatrix, modelMatrix, rotationSpeedHash.x);
  mat4.rotateY(modelMatrix, modelMatrix, rotationSpeedHash.y);
  mat4.rotateZ(modelMatrix, modelMatrix, rotationSpeedHash.z);
}

function configureVerticesForCube(gl, program, vertices) {
  configureBuffer(gl, program, vertices, 3, 'position');
}

function newModelMatrix() {
  return mat4.create();
}

function newViewMatrix() {
  const matrix = mat4.create();
  mat4.lookAt(matrix, [0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  return matrix;
}

function newProjectionMatrix() {
  const matrix = mat4.create();
  mat4.perspective(matrix, 30.0, 1.0, 1.0, 100.0);
  return matrix;
}

function programFromCompiledShadersAndUniformNames(gl, vertexShader, fragmentShader, uniformNames) {
  const compiledVertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const compiledFragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const newProgram = linkShader(gl, compiledVertexShader, compiledFragmentShader);
  cacheUniformLocations(gl, newProgram, uniformNames);
  return newProgram;
}

function cacheUniformLocations(gl, program, uniformNames) {
  uniformNames.forEach(function(uniformName) {
    cacheUniformLocation(gl, program, uniformName);
  });
}

// https://nickdesaulniers.github.io/RawWebGL/#/40
function compileShader(gl, type, shaderSrc) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

// https://nickdesaulniers.github.io/RawWebGL/#/41
function linkShader(gl, vertexShader, fragmentShader) {
  const newProgram = gl.createProgram();
  gl.attachShader(newProgram, vertexShader);
  gl.attachShader(newProgram, fragmentShader);
  gl.linkProgram(newProgram);

  if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(newProgram));
  }

  return newProgram;
}

// modified from https://nickdesaulniers.github.io/RawWebGL/#/51
function configureBuffer(gl, program, data, elemPerVertex, attributeName) {
  const attributeLocation = gl.getAttribLocation(program, attributeName);
  const buffer = gl.createBuffer();
  if (!buffer) { throw new Error('Failed to create buffer.'); }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(attributeLocation, elemPerVertex, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attributeLocation);
}

// http://mrdoob.com/projects/glsl_sandbox/
function cacheUniformLocation(gl, program, label) {
  if (!program.uniformsCache) {
    program.uniformsCache = {};
  }

  program.uniformsCache[label] = gl.getUniformLocation(program, label);
}

function randomFloatBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function configureLiveReload() {
  if (ENV !== 'production') {
    console.log('Starting LiveReload...');
    document.write(
      '<script src="http://' + (location.host || 'localhost').split(':')[0] +
      ':35729/livereload.js?snipver=1"></' + 'script>'
    );
  }
}

configureLiveReload();
