// This is ammo.js, a port of Bullet Physics to JavaScript. zlib licensed.

var Ammo = (() => {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(moduleArg = {}) {

var Module = moduleArg;

var readyPromiseResolve, readyPromiseReject;

Module["ready"] = new Promise((resolve, reject) => {
 readyPromiseResolve = resolve;
 readyPromiseReject = reject;
});

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = true;

var ENVIRONMENT_IS_WORKER = false;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = url => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest;
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = title => document.title = title;
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime = Module["noExitRuntime"] || true;

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort(text);
 }
}

var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateMemoryViews() {
 var b = wasmMemory.buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(b);
 Module["HEAP16"] = HEAP16 = new Int16Array(b);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
 Module["HEAP32"] = HEAP32 = new Int32Array(b);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}

var wasmTable;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what += ". Build with -sASSERTIONS for more info.";
 var e = new WebAssembly.RuntimeError(what);
 readyPromiseReject(e);
 throw e;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

var wasmBinaryFile;

wasmBinaryFile = "ammo.wasm.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinarySync(file) {
 if (file == wasmBinaryFile && wasmBinary) {
  return new Uint8Array(wasmBinary);
 }
 if (readBinary) {
  return readBinary(file);
 }
 throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function") {
   return fetch(binaryFile, {
    credentials: "same-origin"
   }).then(response => {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + binaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(() => getBinarySync(binaryFile));
  }
 }
 return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
 return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(instance => instance).then(receiver, reason => {
  err(`failed to asynchronously prepare wasm: ${reason}`);
  abort(reason);
 });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
 if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function") {
  return fetch(binaryFile, {
   credentials: "same-origin"
  }).then(response => {
   var result = WebAssembly.instantiateStreaming(response, imports);
   return result.then(callback, function(reason) {
    err(`wasm streaming compile failed: ${reason}`);
    err("falling back to ArrayBuffer instantiation");
    return instantiateArrayBuffer(binaryFile, imports, callback);
   });
  });
 }
 return instantiateArrayBuffer(binaryFile, imports, callback);
}

function createWasm() {
 var info = {
  "a": wasmImports
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  wasmExports = exports;
  wasmMemory = wasmExports["e"];
  updateMemoryViews();
  wasmTable = wasmExports["ti"];
  addOnInit(wasmExports["f"]);
  removeRunDependency("wasm-instantiate");
  return exports;
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiationResult(result) {
  receiveInstance(result["instance"]);
 }
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err(`Module.instantiateWasm callback failed with error: ${e}`);
   readyPromiseReject(e);
  }
 }
 instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
 return {};
}

var callRuntimeCallbacks = callbacks => {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
};

var _abort = () => {
 abort("");
};

var _emscripten_memcpy_big = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

var getHeapMax = () => 2147483648;

var growMemory = size => {
 var b = wasmMemory.buffer;
 var pages = (size - b.byteLength + 65535) / 65536;
 try {
  wasmMemory.grow(pages);
  updateMemoryViews();
  return 1;
 } catch (e) {}
};

var _emscripten_resize_heap = requestedSize => {
 var oldSize = HEAPU8.length;
 requestedSize >>>= 0;
 var maxHeapSize = getHeapMax();
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  var replacement = growMemory(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
};

var printCharBuffers = [ null, [], [] ];

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
 return str;
};

var printChar = (stream, curr) => {
 var buffer = printCharBuffers[stream];
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
};

var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";

var SYSCALLS = {
 varargs: undefined,
 get() {
  var ret = HEAP32[SYSCALLS.varargs >> 2];
  SYSCALLS.varargs += 4;
  return ret;
 },
 getp() {
  return SYSCALLS.get();
 },
 getStr(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

var _fd_write = (fd, iov, iovcnt, pnum) => {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = HEAPU32[iov >> 2];
  var len = HEAPU32[iov + 4 >> 2];
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, HEAPU8[ptr + j]);
  }
  num += len;
 }
 HEAPU32[pnum >> 2] = num;
 return 0;
};

var uleb128Encode = (n, target) => {
 if (n < 128) {
  target.push(n);
 } else {
  target.push(n % 128 | 128, n >> 7);
 }
};

var sigToWasmTypes = sig => {
 var typeNames = {
  "i": "i32",
  "j": "i64",
  "f": "f32",
  "d": "f64",
  "p": "i32"
 };
 var type = {
  parameters: [],
  results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
 };
 for (var i = 1; i < sig.length; ++i) {
  type.parameters.push(typeNames[sig[i]]);
 }
 return type;
};

var generateFuncType = (sig, target) => {
 var sigRet = sig.slice(0, 1);
 var sigParam = sig.slice(1);
 var typeCodes = {
  "i": 127,
  "p": 127,
  "j": 126,
  "f": 125,
  "d": 124
 };
 target.push(96);
 uleb128Encode(sigParam.length, target);
 for (var i = 0; i < sigParam.length; ++i) {
  target.push(typeCodes[sigParam[i]]);
 }
 if (sigRet == "v") {
  target.push(0);
 } else {
  target.push(1, typeCodes[sigRet]);
 }
};

var convertJsFunctionToWasm = (func, sig) => {
 if (typeof WebAssembly.Function == "function") {
  return new WebAssembly.Function(sigToWasmTypes(sig), func);
 }
 var typeSectionBody = [ 1 ];
 generateFuncType(sig, typeSectionBody);
 var bytes = [ 0, 97, 115, 109, 1, 0, 0, 0, 1 ];
 uleb128Encode(typeSectionBody.length, bytes);
 bytes.push.apply(bytes, typeSectionBody);
 bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
 var module = new WebAssembly.Module(new Uint8Array(bytes));
 var instance = new WebAssembly.Instance(module, {
  "e": {
   "f": func
  }
 });
 var wrappedFunc = instance.exports["f"];
 return wrappedFunc;
};

var wasmTableMirror = [];

var getWasmTableEntry = funcPtr => {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 return func;
};

var updateTableMap = (offset, count) => {
 if (functionsInTableMap) {
  for (var i = offset; i < offset + count; i++) {
   var item = getWasmTableEntry(i);
   if (item) {
    functionsInTableMap.set(item, i);
   }
  }
 }
};

var functionsInTableMap = undefined;

var getFunctionAddress = func => {
 if (!functionsInTableMap) {
  functionsInTableMap = new WeakMap;
  updateTableMap(0, wasmTable.length);
 }
 return functionsInTableMap.get(func) || 0;
};

var freeTableIndexes = [];

var getEmptyTableSlot = () => {
 if (freeTableIndexes.length) {
  return freeTableIndexes.pop();
 }
 try {
  wasmTable.grow(1);
 } catch (err) {
  if (!(err instanceof RangeError)) {
   throw err;
  }
  throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
 }
 return wasmTable.length - 1;
};

var setWasmTableEntry = (idx, func) => {
 wasmTable.set(idx, func);
 wasmTableMirror[idx] = wasmTable.get(idx);
};

var addFunction = (func, sig) => {
 var rtn = getFunctionAddress(func);
 if (rtn) {
  return rtn;
 }
 var ret = getEmptyTableSlot();
 try {
  setWasmTableEntry(ret, func);
 } catch (err) {
  if (!(err instanceof TypeError)) {
   throw err;
  }
  var wrapped = convertJsFunctionToWasm(func, sig);
  setWasmTableEntry(ret, wrapped);
 }
 functionsInTableMap.set(func, ret);
 return ret;
};

var wasmImports = {
 a: _abort,
 c: _emscripten_memcpy_big,
 b: _emscripten_resize_heap,
 d: _fd_write
};

var wasmExports = createWasm();

var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["f"])();

var _webidl_free = Module["_webidl_free"] = a0 => (_webidl_free = Module["_webidl_free"] = wasmExports["g"])(a0);

var _webidl_malloc = Module["_webidl_malloc"] = a0 => (_webidl_malloc = Module["_webidl_malloc"] = wasmExports["h"])(a0);

var _malloc = Module["_malloc"] = a0 => (_malloc = Module["_malloc"] = wasmExports["i"])(a0);

var _emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = wasmExports["j"])(a0, a1);

var _emscripten_bind_btCollisionShape_getLocalScaling_0 = Module["_emscripten_bind_btCollisionShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btCollisionShape_getLocalScaling_0 = Module["_emscripten_bind_btCollisionShape_getLocalScaling_0"] = wasmExports["k"])(a0);

var _emscripten_bind_btCollisionShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCollisionShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btCollisionShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCollisionShape_calculateLocalInertia_2"] = wasmExports["l"])(a0, a1, a2);

var _emscripten_bind_btCollisionShape_setMargin_1 = Module["_emscripten_bind_btCollisionShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btCollisionShape_setMargin_1 = Module["_emscripten_bind_btCollisionShape_setMargin_1"] = wasmExports["m"])(a0, a1);

var _emscripten_bind_btCollisionShape_getMargin_0 = Module["_emscripten_bind_btCollisionShape_getMargin_0"] = a0 => (_emscripten_bind_btCollisionShape_getMargin_0 = Module["_emscripten_bind_btCollisionShape_getMargin_0"] = wasmExports["n"])(a0);

var _emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = a0 => (_emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = wasmExports["o"])(a0);

var _emscripten_bind_btCollisionObject_getCollisionShape_0 = Module["_emscripten_bind_btCollisionObject_getCollisionShape_0"] = a0 => (_emscripten_bind_btCollisionObject_getCollisionShape_0 = Module["_emscripten_bind_btCollisionObject_getCollisionShape_0"] = wasmExports["p"])(a0);

var _emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = a0 => (_emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = wasmExports["q"])(a0);

var _emscripten_bind_btCollisionObject_setFriction_1 = Module["_emscripten_bind_btCollisionObject_setFriction_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setFriction_1 = Module["_emscripten_bind_btCollisionObject_setFriction_1"] = wasmExports["r"])(a0, a1);

var _emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = wasmExports["s"])(a0);

var _emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = wasmExports["t"])(a0, a1);

var _emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = wasmExports["u"])(a0, a1);

var _emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = wasmExports["v"])(a0, a1);

var _emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = a0 => (_emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = wasmExports["w"])(a0);

var _emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = wasmExports["x"])(a0, a1);

var _emscripten_bind_btConcaveShape_getLocalScaling_0 = Module["_emscripten_bind_btConcaveShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btConcaveShape_getLocalScaling_0 = Module["_emscripten_bind_btConcaveShape_getLocalScaling_0"] = wasmExports["y"])(a0);

var _emscripten_bind_btConcaveShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConcaveShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btConcaveShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConcaveShape_calculateLocalInertia_2"] = wasmExports["z"])(a0, a1, a2);

var _emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = a0 => (_emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = wasmExports["A"])(a0);

var _emscripten_bind_btCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btCollisionAlgorithm___destroy___0"] = a0 => (_emscripten_bind_btCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btCollisionAlgorithm___destroy___0"] = wasmExports["B"])(a0);

var _emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = wasmExports["C"])(a0);

var _emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = wasmExports["D"])(a0, a1);

var _emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = wasmExports["E"])(a0, a1, a2);

var _emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = wasmExports["F"])(a0, a1, a2, a3);

var _emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = wasmExports["G"])(a0, a1);

var _emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = wasmExports["H"])(a0);

var _emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = a0 => (_emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = wasmExports["I"])(a0);

var _emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = () => (_emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = wasmExports["J"])();

var _emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = (a0, a1, a2) => (_emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = wasmExports["K"])(a0, a1, a2);

var _emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = a0 => (_emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = wasmExports["L"])(a0);

var _emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = a0 => (_emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = wasmExports["M"])(a0);

var _emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = a0 => (_emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = wasmExports["N"])(a0);

var _emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = a0 => (_emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = wasmExports["O"])(a0);

var _emscripten_bind_btVector3_setX_1 = Module["_emscripten_bind_btVector3_setX_1"] = (a0, a1) => (_emscripten_bind_btVector3_setX_1 = Module["_emscripten_bind_btVector3_setX_1"] = wasmExports["P"])(a0, a1);

var _emscripten_bind_btVector3_setY_1 = Module["_emscripten_bind_btVector3_setY_1"] = (a0, a1) => (_emscripten_bind_btVector3_setY_1 = Module["_emscripten_bind_btVector3_setY_1"] = wasmExports["Q"])(a0, a1);

var _emscripten_bind_btVector3_setZ_1 = Module["_emscripten_bind_btVector3_setZ_1"] = (a0, a1) => (_emscripten_bind_btVector3_setZ_1 = Module["_emscripten_bind_btVector3_setZ_1"] = wasmExports["R"])(a0, a1);

var _emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = wasmExports["S"])(a0, a1, a2, a3);

var _emscripten_bind_btVector3_normalize_0 = Module["_emscripten_bind_btVector3_normalize_0"] = a0 => (_emscripten_bind_btVector3_normalize_0 = Module["_emscripten_bind_btVector3_normalize_0"] = wasmExports["T"])(a0);

var _emscripten_bind_btVector3_rotate_2 = Module["_emscripten_bind_btVector3_rotate_2"] = (a0, a1, a2) => (_emscripten_bind_btVector3_rotate_2 = Module["_emscripten_bind_btVector3_rotate_2"] = wasmExports["U"])(a0, a1, a2);

var _emscripten_bind_btVector3_dot_1 = Module["_emscripten_bind_btVector3_dot_1"] = (a0, a1) => (_emscripten_bind_btVector3_dot_1 = Module["_emscripten_bind_btVector3_dot_1"] = wasmExports["V"])(a0, a1);

var _emscripten_bind_btVector3_op_mul_1 = Module["_emscripten_bind_btVector3_op_mul_1"] = (a0, a1) => (_emscripten_bind_btVector3_op_mul_1 = Module["_emscripten_bind_btVector3_op_mul_1"] = wasmExports["W"])(a0, a1);

var _emscripten_bind_btVector3_op_add_1 = Module["_emscripten_bind_btVector3_op_add_1"] = (a0, a1) => (_emscripten_bind_btVector3_op_add_1 = Module["_emscripten_bind_btVector3_op_add_1"] = wasmExports["X"])(a0, a1);

var _emscripten_bind_btVector3_op_sub_1 = Module["_emscripten_bind_btVector3_op_sub_1"] = (a0, a1) => (_emscripten_bind_btVector3_op_sub_1 = Module["_emscripten_bind_btVector3_op_sub_1"] = wasmExports["Y"])(a0, a1);

var _emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = a0 => (_emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = wasmExports["Z"])(a0);

var _emscripten_bind_btQuadWord_x_0 = Module["_emscripten_bind_btQuadWord_x_0"] = a0 => (_emscripten_bind_btQuadWord_x_0 = Module["_emscripten_bind_btQuadWord_x_0"] = wasmExports["_"])(a0);

var _emscripten_bind_btQuadWord_y_0 = Module["_emscripten_bind_btQuadWord_y_0"] = a0 => (_emscripten_bind_btQuadWord_y_0 = Module["_emscripten_bind_btQuadWord_y_0"] = wasmExports["$"])(a0);

var _emscripten_bind_btQuadWord_z_0 = Module["_emscripten_bind_btQuadWord_z_0"] = a0 => (_emscripten_bind_btQuadWord_z_0 = Module["_emscripten_bind_btQuadWord_z_0"] = wasmExports["aa"])(a0);

var _emscripten_bind_btQuadWord_w_0 = Module["_emscripten_bind_btQuadWord_w_0"] = a0 => (_emscripten_bind_btQuadWord_w_0 = Module["_emscripten_bind_btQuadWord_w_0"] = wasmExports["ba"])(a0);

var _emscripten_bind_btQuadWord_setX_1 = Module["_emscripten_bind_btQuadWord_setX_1"] = (a0, a1) => (_emscripten_bind_btQuadWord_setX_1 = Module["_emscripten_bind_btQuadWord_setX_1"] = wasmExports["ca"])(a0, a1);

var _emscripten_bind_btQuadWord_setY_1 = Module["_emscripten_bind_btQuadWord_setY_1"] = (a0, a1) => (_emscripten_bind_btQuadWord_setY_1 = Module["_emscripten_bind_btQuadWord_setY_1"] = wasmExports["da"])(a0, a1);

var _emscripten_bind_btQuadWord_setZ_1 = Module["_emscripten_bind_btQuadWord_setZ_1"] = (a0, a1) => (_emscripten_bind_btQuadWord_setZ_1 = Module["_emscripten_bind_btQuadWord_setZ_1"] = wasmExports["ea"])(a0, a1);

var _emscripten_bind_btQuadWord_setW_1 = Module["_emscripten_bind_btQuadWord_setW_1"] = (a0, a1) => (_emscripten_bind_btQuadWord_setW_1 = Module["_emscripten_bind_btQuadWord_setW_1"] = wasmExports["fa"])(a0, a1);

var _emscripten_bind_btQuadWord___destroy___0 = Module["_emscripten_bind_btQuadWord___destroy___0"] = a0 => (_emscripten_bind_btQuadWord___destroy___0 = Module["_emscripten_bind_btQuadWord___destroy___0"] = wasmExports["ga"])(a0);

var _emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = wasmExports["ha"])(a0, a1);

var _emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = wasmExports["ia"])(a0, a1);

var _emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = a0 => (_emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = wasmExports["ja"])(a0);

var _emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = wasmExports["ka"])(a0, a1);

var _emscripten_bind_btConvexShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btConvexShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexShape_getLocalScaling_0"] = wasmExports["la"])(a0);

var _emscripten_bind_btConvexShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btConvexShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexShape_calculateLocalInertia_2"] = wasmExports["ma"])(a0, a1, a2);

var _emscripten_bind_btConvexShape_setMargin_1 = Module["_emscripten_bind_btConvexShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btConvexShape_setMargin_1 = Module["_emscripten_bind_btConvexShape_setMargin_1"] = wasmExports["na"])(a0, a1);

var _emscripten_bind_btConvexShape_getMargin_0 = Module["_emscripten_bind_btConvexShape_getMargin_0"] = a0 => (_emscripten_bind_btConvexShape_getMargin_0 = Module["_emscripten_bind_btConvexShape_getMargin_0"] = wasmExports["oa"])(a0);

var _emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = a0 => (_emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = wasmExports["pa"])(a0);

var _emscripten_bind_btStridingMeshInterface_setScaling_1 = Module["_emscripten_bind_btStridingMeshInterface_setScaling_1"] = (a0, a1) => (_emscripten_bind_btStridingMeshInterface_setScaling_1 = Module["_emscripten_bind_btStridingMeshInterface_setScaling_1"] = wasmExports["qa"])(a0, a1);

var _emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = a0 => (_emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = wasmExports["ra"])(a0);

var _emscripten_bind_btTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btTriangleMeshShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btTriangleMeshShape_setLocalScaling_1"] = wasmExports["sa"])(a0, a1);

var _emscripten_bind_btTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btTriangleMeshShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btTriangleMeshShape_getLocalScaling_0"] = wasmExports["ta"])(a0);

var _emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2"] = wasmExports["ua"])(a0, a1, a2);

var _emscripten_bind_btTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btTriangleMeshShape___destroy___0"] = a0 => (_emscripten_bind_btTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btTriangleMeshShape___destroy___0"] = wasmExports["va"])(a0);

var _emscripten_bind_btActivatingCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btActivatingCollisionAlgorithm___destroy___0"] = a0 => (_emscripten_bind_btActivatingCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btActivatingCollisionAlgorithm___destroy___0"] = wasmExports["wa"])(a0);

var _emscripten_bind_btDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btDispatcher_getNumManifolds_0"] = a0 => (_emscripten_bind_btDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btDispatcher_getNumManifolds_0"] = wasmExports["xa"])(a0);

var _emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = a0 => (_emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = wasmExports["ya"])(a0);

var _emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = wasmExports["za"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDynamicsWorld_removeAction_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDynamicsWorld_removeAction_1"] = wasmExports["Aa"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDynamicsWorld_getSolverInfo_0"] = a0 => (_emscripten_bind_btDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDynamicsWorld_getSolverInfo_0"] = wasmExports["Ba"])(a0);

var _emscripten_bind_btDynamicsWorld_setInternalTickCallback_1 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_setInternalTickCallback_1 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_1"] = wasmExports["Ca"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_setInternalTickCallback_2 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_2"] = (a0, a1, a2) => (_emscripten_bind_btDynamicsWorld_setInternalTickCallback_2 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_2"] = wasmExports["Da"])(a0, a1, a2);

var _emscripten_bind_btDynamicsWorld_setInternalTickCallback_3 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDynamicsWorld_setInternalTickCallback_3 = Module["_emscripten_bind_btDynamicsWorld_setInternalTickCallback_3"] = wasmExports["Ea"])(a0, a1, a2, a3);

var _emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = wasmExports["Fa"])(a0);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = wasmExports["Ga"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = wasmExports["Ha"])(a0, a1, a2);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = wasmExports["Ia"])(a0, a1, a2, a3);

var _emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = wasmExports["Ja"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = wasmExports["Ka"])(a0);

var _emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = a0 => (_emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = wasmExports["La"])(a0);

var _emscripten_bind_btActionInterface_updateAction_2 = Module["_emscripten_bind_btActionInterface_updateAction_2"] = (a0, a1, a2) => (_emscripten_bind_btActionInterface_updateAction_2 = Module["_emscripten_bind_btActionInterface_updateAction_2"] = wasmExports["Ma"])(a0, a1, a2);

var _emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = a0 => (_emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = wasmExports["Na"])(a0);

var _emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = () => (_emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = wasmExports["Oa"])();

var _emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = a0 => (_emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = wasmExports["Pa"])(a0);

var _emscripten_bind_btGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btGhostObject_getOverlappingObject_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btGhostObject_getOverlappingObject_1"] = wasmExports["Qa"])(a0, a1);

var _emscripten_bind_btGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btGhostObject_getCollisionShape_0"] = a0 => (_emscripten_bind_btGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btGhostObject_getCollisionShape_0"] = wasmExports["Ra"])(a0);

var _emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = a0 => (_emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = wasmExports["Sa"])(a0);

var _emscripten_bind_btGhostObject_setFriction_1 = Module["_emscripten_bind_btGhostObject_setFriction_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setFriction_1 = Module["_emscripten_bind_btGhostObject_setFriction_1"] = wasmExports["Ta"])(a0, a1);

var _emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = wasmExports["Ua"])(a0);

var _emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = wasmExports["Va"])(a0, a1);

var _emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = wasmExports["Wa"])(a0, a1);

var _emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = wasmExports["Xa"])(a0, a1);

var _emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = a0 => (_emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = wasmExports["Ya"])(a0);

var _emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = a0 => (_emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = wasmExports["Za"])(a0);

var _emscripten_bind_btVector4_btVector4_0 = Module["_emscripten_bind_btVector4_btVector4_0"] = () => (_emscripten_bind_btVector4_btVector4_0 = Module["_emscripten_bind_btVector4_btVector4_0"] = wasmExports["_a"])();

var _emscripten_bind_btVector4_btVector4_4 = Module["_emscripten_bind_btVector4_btVector4_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btVector4_btVector4_4 = Module["_emscripten_bind_btVector4_btVector4_4"] = wasmExports["$a"])(a0, a1, a2, a3);

var _emscripten_bind_btVector4_w_0 = Module["_emscripten_bind_btVector4_w_0"] = a0 => (_emscripten_bind_btVector4_w_0 = Module["_emscripten_bind_btVector4_w_0"] = wasmExports["ab"])(a0);

var _emscripten_bind_btVector4_setValue_4 = Module["_emscripten_bind_btVector4_setValue_4"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_btVector4_setValue_4 = Module["_emscripten_bind_btVector4_setValue_4"] = wasmExports["bb"])(a0, a1, a2, a3, a4);

var _emscripten_bind_btVector4_length_0 = Module["_emscripten_bind_btVector4_length_0"] = a0 => (_emscripten_bind_btVector4_length_0 = Module["_emscripten_bind_btVector4_length_0"] = wasmExports["cb"])(a0);

var _emscripten_bind_btVector4_x_0 = Module["_emscripten_bind_btVector4_x_0"] = a0 => (_emscripten_bind_btVector4_x_0 = Module["_emscripten_bind_btVector4_x_0"] = wasmExports["db"])(a0);

var _emscripten_bind_btVector4_y_0 = Module["_emscripten_bind_btVector4_y_0"] = a0 => (_emscripten_bind_btVector4_y_0 = Module["_emscripten_bind_btVector4_y_0"] = wasmExports["eb"])(a0);

var _emscripten_bind_btVector4_z_0 = Module["_emscripten_bind_btVector4_z_0"] = a0 => (_emscripten_bind_btVector4_z_0 = Module["_emscripten_bind_btVector4_z_0"] = wasmExports["fb"])(a0);

var _emscripten_bind_btVector4_setX_1 = Module["_emscripten_bind_btVector4_setX_1"] = (a0, a1) => (_emscripten_bind_btVector4_setX_1 = Module["_emscripten_bind_btVector4_setX_1"] = wasmExports["gb"])(a0, a1);

var _emscripten_bind_btVector4_setY_1 = Module["_emscripten_bind_btVector4_setY_1"] = (a0, a1) => (_emscripten_bind_btVector4_setY_1 = Module["_emscripten_bind_btVector4_setY_1"] = wasmExports["hb"])(a0, a1);

var _emscripten_bind_btVector4_setZ_1 = Module["_emscripten_bind_btVector4_setZ_1"] = (a0, a1) => (_emscripten_bind_btVector4_setZ_1 = Module["_emscripten_bind_btVector4_setZ_1"] = wasmExports["ib"])(a0, a1);

var _emscripten_bind_btVector4_normalize_0 = Module["_emscripten_bind_btVector4_normalize_0"] = a0 => (_emscripten_bind_btVector4_normalize_0 = Module["_emscripten_bind_btVector4_normalize_0"] = wasmExports["jb"])(a0);

var _emscripten_bind_btVector4_rotate_2 = Module["_emscripten_bind_btVector4_rotate_2"] = (a0, a1, a2) => (_emscripten_bind_btVector4_rotate_2 = Module["_emscripten_bind_btVector4_rotate_2"] = wasmExports["kb"])(a0, a1, a2);

var _emscripten_bind_btVector4_dot_1 = Module["_emscripten_bind_btVector4_dot_1"] = (a0, a1) => (_emscripten_bind_btVector4_dot_1 = Module["_emscripten_bind_btVector4_dot_1"] = wasmExports["lb"])(a0, a1);

var _emscripten_bind_btVector4_op_mul_1 = Module["_emscripten_bind_btVector4_op_mul_1"] = (a0, a1) => (_emscripten_bind_btVector4_op_mul_1 = Module["_emscripten_bind_btVector4_op_mul_1"] = wasmExports["mb"])(a0, a1);

var _emscripten_bind_btVector4_op_add_1 = Module["_emscripten_bind_btVector4_op_add_1"] = (a0, a1) => (_emscripten_bind_btVector4_op_add_1 = Module["_emscripten_bind_btVector4_op_add_1"] = wasmExports["nb"])(a0, a1);

var _emscripten_bind_btVector4_op_sub_1 = Module["_emscripten_bind_btVector4_op_sub_1"] = (a0, a1) => (_emscripten_bind_btVector4_op_sub_1 = Module["_emscripten_bind_btVector4_op_sub_1"] = wasmExports["ob"])(a0, a1);

var _emscripten_bind_btVector4___destroy___0 = Module["_emscripten_bind_btVector4___destroy___0"] = a0 => (_emscripten_bind_btVector4___destroy___0 = Module["_emscripten_bind_btVector4___destroy___0"] = wasmExports["pb"])(a0);

var _emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = wasmExports["qb"])(a0, a1, a2, a3);

var _emscripten_bind_btQuaternion_setValue_4 = Module["_emscripten_bind_btQuaternion_setValue_4"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_btQuaternion_setValue_4 = Module["_emscripten_bind_btQuaternion_setValue_4"] = wasmExports["rb"])(a0, a1, a2, a3, a4);

var _emscripten_bind_btQuaternion_setEulerZYX_3 = Module["_emscripten_bind_btQuaternion_setEulerZYX_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btQuaternion_setEulerZYX_3 = Module["_emscripten_bind_btQuaternion_setEulerZYX_3"] = wasmExports["sb"])(a0, a1, a2, a3);

var _emscripten_bind_btQuaternion_setRotation_2 = Module["_emscripten_bind_btQuaternion_setRotation_2"] = (a0, a1, a2) => (_emscripten_bind_btQuaternion_setRotation_2 = Module["_emscripten_bind_btQuaternion_setRotation_2"] = wasmExports["tb"])(a0, a1, a2);

var _emscripten_bind_btQuaternion_normalize_0 = Module["_emscripten_bind_btQuaternion_normalize_0"] = a0 => (_emscripten_bind_btQuaternion_normalize_0 = Module["_emscripten_bind_btQuaternion_normalize_0"] = wasmExports["ub"])(a0);

var _emscripten_bind_btQuaternion_length2_0 = Module["_emscripten_bind_btQuaternion_length2_0"] = a0 => (_emscripten_bind_btQuaternion_length2_0 = Module["_emscripten_bind_btQuaternion_length2_0"] = wasmExports["vb"])(a0);

var _emscripten_bind_btQuaternion_length_0 = Module["_emscripten_bind_btQuaternion_length_0"] = a0 => (_emscripten_bind_btQuaternion_length_0 = Module["_emscripten_bind_btQuaternion_length_0"] = wasmExports["wb"])(a0);

var _emscripten_bind_btQuaternion_dot_1 = Module["_emscripten_bind_btQuaternion_dot_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_dot_1 = Module["_emscripten_bind_btQuaternion_dot_1"] = wasmExports["xb"])(a0, a1);

var _emscripten_bind_btQuaternion_normalized_0 = Module["_emscripten_bind_btQuaternion_normalized_0"] = a0 => (_emscripten_bind_btQuaternion_normalized_0 = Module["_emscripten_bind_btQuaternion_normalized_0"] = wasmExports["yb"])(a0);

var _emscripten_bind_btQuaternion_getAxis_0 = Module["_emscripten_bind_btQuaternion_getAxis_0"] = a0 => (_emscripten_bind_btQuaternion_getAxis_0 = Module["_emscripten_bind_btQuaternion_getAxis_0"] = wasmExports["zb"])(a0);

var _emscripten_bind_btQuaternion_inverse_0 = Module["_emscripten_bind_btQuaternion_inverse_0"] = a0 => (_emscripten_bind_btQuaternion_inverse_0 = Module["_emscripten_bind_btQuaternion_inverse_0"] = wasmExports["Ab"])(a0);

var _emscripten_bind_btQuaternion_getAngle_0 = Module["_emscripten_bind_btQuaternion_getAngle_0"] = a0 => (_emscripten_bind_btQuaternion_getAngle_0 = Module["_emscripten_bind_btQuaternion_getAngle_0"] = wasmExports["Bb"])(a0);

var _emscripten_bind_btQuaternion_getAngleShortestPath_0 = Module["_emscripten_bind_btQuaternion_getAngleShortestPath_0"] = a0 => (_emscripten_bind_btQuaternion_getAngleShortestPath_0 = Module["_emscripten_bind_btQuaternion_getAngleShortestPath_0"] = wasmExports["Cb"])(a0);

var _emscripten_bind_btQuaternion_angle_1 = Module["_emscripten_bind_btQuaternion_angle_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_angle_1 = Module["_emscripten_bind_btQuaternion_angle_1"] = wasmExports["Db"])(a0, a1);

var _emscripten_bind_btQuaternion_angleShortestPath_1 = Module["_emscripten_bind_btQuaternion_angleShortestPath_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_angleShortestPath_1 = Module["_emscripten_bind_btQuaternion_angleShortestPath_1"] = wasmExports["Eb"])(a0, a1);

var _emscripten_bind_btQuaternion_op_add_1 = Module["_emscripten_bind_btQuaternion_op_add_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_op_add_1 = Module["_emscripten_bind_btQuaternion_op_add_1"] = wasmExports["Fb"])(a0, a1);

var _emscripten_bind_btQuaternion_op_sub_1 = Module["_emscripten_bind_btQuaternion_op_sub_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_op_sub_1 = Module["_emscripten_bind_btQuaternion_op_sub_1"] = wasmExports["Gb"])(a0, a1);

var _emscripten_bind_btQuaternion_op_mul_1 = Module["_emscripten_bind_btQuaternion_op_mul_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_op_mul_1 = Module["_emscripten_bind_btQuaternion_op_mul_1"] = wasmExports["Hb"])(a0, a1);

var _emscripten_bind_btQuaternion_op_mulq_1 = Module["_emscripten_bind_btQuaternion_op_mulq_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_op_mulq_1 = Module["_emscripten_bind_btQuaternion_op_mulq_1"] = wasmExports["Ib"])(a0, a1);

var _emscripten_bind_btQuaternion_op_div_1 = Module["_emscripten_bind_btQuaternion_op_div_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_op_div_1 = Module["_emscripten_bind_btQuaternion_op_div_1"] = wasmExports["Jb"])(a0, a1);

var _emscripten_bind_btQuaternion_x_0 = Module["_emscripten_bind_btQuaternion_x_0"] = a0 => (_emscripten_bind_btQuaternion_x_0 = Module["_emscripten_bind_btQuaternion_x_0"] = wasmExports["Kb"])(a0);

var _emscripten_bind_btQuaternion_y_0 = Module["_emscripten_bind_btQuaternion_y_0"] = a0 => (_emscripten_bind_btQuaternion_y_0 = Module["_emscripten_bind_btQuaternion_y_0"] = wasmExports["Lb"])(a0);

var _emscripten_bind_btQuaternion_z_0 = Module["_emscripten_bind_btQuaternion_z_0"] = a0 => (_emscripten_bind_btQuaternion_z_0 = Module["_emscripten_bind_btQuaternion_z_0"] = wasmExports["Mb"])(a0);

var _emscripten_bind_btQuaternion_w_0 = Module["_emscripten_bind_btQuaternion_w_0"] = a0 => (_emscripten_bind_btQuaternion_w_0 = Module["_emscripten_bind_btQuaternion_w_0"] = wasmExports["Nb"])(a0);

var _emscripten_bind_btQuaternion_setX_1 = Module["_emscripten_bind_btQuaternion_setX_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_setX_1 = Module["_emscripten_bind_btQuaternion_setX_1"] = wasmExports["Ob"])(a0, a1);

var _emscripten_bind_btQuaternion_setY_1 = Module["_emscripten_bind_btQuaternion_setY_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_setY_1 = Module["_emscripten_bind_btQuaternion_setY_1"] = wasmExports["Pb"])(a0, a1);

var _emscripten_bind_btQuaternion_setZ_1 = Module["_emscripten_bind_btQuaternion_setZ_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_setZ_1 = Module["_emscripten_bind_btQuaternion_setZ_1"] = wasmExports["Qb"])(a0, a1);

var _emscripten_bind_btQuaternion_setW_1 = Module["_emscripten_bind_btQuaternion_setW_1"] = (a0, a1) => (_emscripten_bind_btQuaternion_setW_1 = Module["_emscripten_bind_btQuaternion_setW_1"] = wasmExports["Rb"])(a0, a1);

var _emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = a0 => (_emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = wasmExports["Sb"])(a0);

var _emscripten_bind_btMatrix3x3_setEulerZYX_3 = Module["_emscripten_bind_btMatrix3x3_setEulerZYX_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btMatrix3x3_setEulerZYX_3 = Module["_emscripten_bind_btMatrix3x3_setEulerZYX_3"] = wasmExports["Tb"])(a0, a1, a2, a3);

var _emscripten_bind_btMatrix3x3_getRotation_1 = Module["_emscripten_bind_btMatrix3x3_getRotation_1"] = (a0, a1) => (_emscripten_bind_btMatrix3x3_getRotation_1 = Module["_emscripten_bind_btMatrix3x3_getRotation_1"] = wasmExports["Ub"])(a0, a1);

var _emscripten_bind_btMatrix3x3_getRow_1 = Module["_emscripten_bind_btMatrix3x3_getRow_1"] = (a0, a1) => (_emscripten_bind_btMatrix3x3_getRow_1 = Module["_emscripten_bind_btMatrix3x3_getRow_1"] = wasmExports["Vb"])(a0, a1);

var _emscripten_bind_btMatrix3x3___destroy___0 = Module["_emscripten_bind_btMatrix3x3___destroy___0"] = a0 => (_emscripten_bind_btMatrix3x3___destroy___0 = Module["_emscripten_bind_btMatrix3x3___destroy___0"] = wasmExports["Wb"])(a0);

var _emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = () => (_emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = wasmExports["Xb"])();

var _emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = (a0, a1) => (_emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = wasmExports["Yb"])(a0, a1);

var _emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = a0 => (_emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = wasmExports["Zb"])(a0);

var _emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = (a0, a1) => (_emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = wasmExports["_b"])(a0, a1);

var _emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = (a0, a1) => (_emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = wasmExports["$b"])(a0, a1);

var _emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = a0 => (_emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = wasmExports["ac"])(a0);

var _emscripten_bind_btTransform_getRotation_0 = Module["_emscripten_bind_btTransform_getRotation_0"] = a0 => (_emscripten_bind_btTransform_getRotation_0 = Module["_emscripten_bind_btTransform_getRotation_0"] = wasmExports["bc"])(a0);

var _emscripten_bind_btTransform_getBasis_0 = Module["_emscripten_bind_btTransform_getBasis_0"] = a0 => (_emscripten_bind_btTransform_getBasis_0 = Module["_emscripten_bind_btTransform_getBasis_0"] = wasmExports["cc"])(a0);

var _emscripten_bind_btTransform_inverse_0 = Module["_emscripten_bind_btTransform_inverse_0"] = a0 => (_emscripten_bind_btTransform_inverse_0 = Module["_emscripten_bind_btTransform_inverse_0"] = wasmExports["dc"])(a0);

var _emscripten_bind_btTransform_op_mul_1 = Module["_emscripten_bind_btTransform_op_mul_1"] = (a0, a1) => (_emscripten_bind_btTransform_op_mul_1 = Module["_emscripten_bind_btTransform_op_mul_1"] = wasmExports["ec"])(a0, a1);

var _emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = a0 => (_emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = wasmExports["fc"])(a0);

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = () => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = wasmExports["gc"])();

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = a0 => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = wasmExports["hc"])(a0);

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = wasmExports["ic"])(a0, a1);

var _emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = wasmExports["jc"])(a0, a1);

var _emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = wasmExports["kc"])(a0, a1);

var _emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0 = Module["_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0"] = a0 => (_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0 = Module["_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0"] = wasmExports["lc"])(a0);

var _emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1 = Module["_emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1 = Module["_emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1"] = wasmExports["mc"])(a0, a1);

var _emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = a0 => (_emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = wasmExports["nc"])(a0);

var _emscripten_bind_btCollisionObjectWrapper_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getWorldTransform_0"] = a0 => (_emscripten_bind_btCollisionObjectWrapper_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getWorldTransform_0"] = wasmExports["oc"])(a0);

var _emscripten_bind_btCollisionObjectWrapper_getCollisionObject_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getCollisionObject_0"] = a0 => (_emscripten_bind_btCollisionObjectWrapper_getCollisionObject_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getCollisionObject_0"] = wasmExports["pc"])(a0);

var _emscripten_bind_btCollisionObjectWrapper_getCollisionShape_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getCollisionShape_0"] = a0 => (_emscripten_bind_btCollisionObjectWrapper_getCollisionShape_0 = Module["_emscripten_bind_btCollisionObjectWrapper_getCollisionShape_0"] = wasmExports["qc"])(a0);

var _emscripten_bind_btManifoldPoint_getPositionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0"] = a0 => (_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0"] = wasmExports["rc"])(a0);

var _emscripten_bind_btManifoldPoint_getPositionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0"] = a0 => (_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0"] = wasmExports["sc"])(a0);

var _emscripten_bind_btManifoldPoint_getAppliedImpulse_0 = Module["_emscripten_bind_btManifoldPoint_getAppliedImpulse_0"] = a0 => (_emscripten_bind_btManifoldPoint_getAppliedImpulse_0 = Module["_emscripten_bind_btManifoldPoint_getAppliedImpulse_0"] = wasmExports["tc"])(a0);

var _emscripten_bind_btManifoldPoint_getDistance_0 = Module["_emscripten_bind_btManifoldPoint_getDistance_0"] = a0 => (_emscripten_bind_btManifoldPoint_getDistance_0 = Module["_emscripten_bind_btManifoldPoint_getDistance_0"] = wasmExports["uc"])(a0);

var _emscripten_bind_btManifoldPoint_get_m_localPointA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointA_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_localPointA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointA_0"] = wasmExports["vc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_localPointA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointA_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_localPointA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointA_1"] = wasmExports["wc"])(a0, a1);

var _emscripten_bind_btManifoldPoint_get_m_localPointB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointB_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_localPointB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointB_0"] = wasmExports["xc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_localPointB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointB_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_localPointB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointB_1"] = wasmExports["yc"])(a0, a1);

var _emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0"] = wasmExports["zc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1"] = wasmExports["Ac"])(a0, a1);

var _emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0"] = wasmExports["Bc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1"] = wasmExports["Cc"])(a0, a1);

var _emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0"] = wasmExports["Dc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1"] = wasmExports["Ec"])(a0, a1);

var _emscripten_bind_btManifoldPoint_get_m_userPersistentData_0 = Module["_emscripten_bind_btManifoldPoint_get_m_userPersistentData_0"] = a0 => (_emscripten_bind_btManifoldPoint_get_m_userPersistentData_0 = Module["_emscripten_bind_btManifoldPoint_get_m_userPersistentData_0"] = wasmExports["Fc"])(a0);

var _emscripten_bind_btManifoldPoint_set_m_userPersistentData_1 = Module["_emscripten_bind_btManifoldPoint_set_m_userPersistentData_1"] = (a0, a1) => (_emscripten_bind_btManifoldPoint_set_m_userPersistentData_1 = Module["_emscripten_bind_btManifoldPoint_set_m_userPersistentData_1"] = wasmExports["Gc"])(a0, a1);

var _emscripten_bind_btManifoldPoint___destroy___0 = Module["_emscripten_bind_btManifoldPoint___destroy___0"] = a0 => (_emscripten_bind_btManifoldPoint___destroy___0 = Module["_emscripten_bind_btManifoldPoint___destroy___0"] = wasmExports["Hc"])(a0);

var _emscripten_bind_LocalShapeInfo_get_m_shapePart_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_shapePart_0"] = a0 => (_emscripten_bind_LocalShapeInfo_get_m_shapePart_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_shapePart_0"] = wasmExports["Ic"])(a0);

var _emscripten_bind_LocalShapeInfo_set_m_shapePart_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_shapePart_1"] = (a0, a1) => (_emscripten_bind_LocalShapeInfo_set_m_shapePart_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_shapePart_1"] = wasmExports["Jc"])(a0, a1);

var _emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0"] = a0 => (_emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0"] = wasmExports["Kc"])(a0);

var _emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1"] = (a0, a1) => (_emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1"] = wasmExports["Lc"])(a0, a1);

var _emscripten_bind_LocalShapeInfo___destroy___0 = Module["_emscripten_bind_LocalShapeInfo___destroy___0"] = a0 => (_emscripten_bind_LocalShapeInfo___destroy___0 = Module["_emscripten_bind_LocalShapeInfo___destroy___0"] = wasmExports["Mc"])(a0);

var _emscripten_bind_LocalConvexResult_LocalConvexResult_5 = Module["_emscripten_bind_LocalConvexResult_LocalConvexResult_5"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_LocalConvexResult_LocalConvexResult_5 = Module["_emscripten_bind_LocalConvexResult_LocalConvexResult_5"] = wasmExports["Nc"])(a0, a1, a2, a3, a4);

var _emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0"] = a0 => (_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0"] = wasmExports["Oc"])(a0);

var _emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1"] = (a0, a1) => (_emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1"] = wasmExports["Pc"])(a0, a1);

var _emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0 = Module["_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0"] = a0 => (_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0 = Module["_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0"] = wasmExports["Qc"])(a0);

var _emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1 = Module["_emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1"] = (a0, a1) => (_emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1 = Module["_emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1"] = wasmExports["Rc"])(a0, a1);

var _emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0"] = a0 => (_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0"] = wasmExports["Sc"])(a0);

var _emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1"] = (a0, a1) => (_emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1"] = wasmExports["Tc"])(a0, a1);

var _emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0"] = a0 => (_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0"] = wasmExports["Uc"])(a0);

var _emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1"] = (a0, a1) => (_emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1"] = wasmExports["Vc"])(a0, a1);

var _emscripten_bind_LocalConvexResult_get_m_hitFraction_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitFraction_0"] = a0 => (_emscripten_bind_LocalConvexResult_get_m_hitFraction_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitFraction_0"] = wasmExports["Wc"])(a0);

var _emscripten_bind_LocalConvexResult_set_m_hitFraction_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitFraction_1"] = (a0, a1) => (_emscripten_bind_LocalConvexResult_set_m_hitFraction_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitFraction_1"] = wasmExports["Xc"])(a0, a1);

var _emscripten_bind_LocalConvexResult___destroy___0 = Module["_emscripten_bind_LocalConvexResult___destroy___0"] = a0 => (_emscripten_bind_LocalConvexResult___destroy___0 = Module["_emscripten_bind_LocalConvexResult___destroy___0"] = wasmExports["Yc"])(a0);

var _emscripten_bind_ConvexResultCallback_hasHit_0 = Module["_emscripten_bind_ConvexResultCallback_hasHit_0"] = a0 => (_emscripten_bind_ConvexResultCallback_hasHit_0 = Module["_emscripten_bind_ConvexResultCallback_hasHit_0"] = wasmExports["Zc"])(a0);

var _emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0"] = a0 => (_emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0"] = wasmExports["_c"])(a0);

var _emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1"] = (a0, a1) => (_emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1"] = wasmExports["$c"])(a0, a1);

var _emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0"] = a0 => (_emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0"] = wasmExports["ad"])(a0);

var _emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1"] = (a0, a1) => (_emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1"] = wasmExports["bd"])(a0, a1);

var _emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0"] = a0 => (_emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0"] = wasmExports["cd"])(a0);

var _emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1"] = (a0, a1) => (_emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1"] = wasmExports["dd"])(a0, a1);

var _emscripten_bind_ConvexResultCallback___destroy___0 = Module["_emscripten_bind_ConvexResultCallback___destroy___0"] = a0 => (_emscripten_bind_ConvexResultCallback___destroy___0 = Module["_emscripten_bind_ConvexResultCallback___destroy___0"] = wasmExports["ed"])(a0);

var _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1"] = a0 => (_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1"] = wasmExports["fd"])(a0);

var _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2"] = (a0, a1) => (_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2"] = wasmExports["gd"])(a0, a1);

var _emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1"] = wasmExports["hd"])(a0, a1);

var _emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0"] = wasmExports["id"])(a0);

var _emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2"] = wasmExports["jd"])(a0, a1, a2);

var _emscripten_bind_btConvexTriangleMeshShape_setMargin_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btConvexTriangleMeshShape_setMargin_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setMargin_1"] = wasmExports["kd"])(a0, a1);

var _emscripten_bind_btConvexTriangleMeshShape_getMargin_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getMargin_0"] = a0 => (_emscripten_bind_btConvexTriangleMeshShape_getMargin_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getMargin_0"] = wasmExports["ld"])(a0);

var _emscripten_bind_btConvexTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btConvexTriangleMeshShape___destroy___0"] = a0 => (_emscripten_bind_btConvexTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btConvexTriangleMeshShape___destroy___0"] = wasmExports["md"])(a0);

var _emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = a0 => (_emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = wasmExports["nd"])(a0);

var _emscripten_bind_btBoxShape_setMargin_1 = Module["_emscripten_bind_btBoxShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btBoxShape_setMargin_1 = Module["_emscripten_bind_btBoxShape_setMargin_1"] = wasmExports["od"])(a0, a1);

var _emscripten_bind_btBoxShape_getMargin_0 = Module["_emscripten_bind_btBoxShape_getMargin_0"] = a0 => (_emscripten_bind_btBoxShape_getMargin_0 = Module["_emscripten_bind_btBoxShape_getMargin_0"] = wasmExports["pd"])(a0);

var _emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = wasmExports["qd"])(a0, a1);

var _emscripten_bind_btBoxShape_getLocalScaling_0 = Module["_emscripten_bind_btBoxShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btBoxShape_getLocalScaling_0 = Module["_emscripten_bind_btBoxShape_getLocalScaling_0"] = wasmExports["rd"])(a0);

var _emscripten_bind_btBoxShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBoxShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btBoxShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBoxShape_calculateLocalInertia_2"] = wasmExports["sd"])(a0, a1, a2);

var _emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = a0 => (_emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = wasmExports["td"])(a0);

var _emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = (a0, a1) => (_emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = wasmExports["ud"])(a0, a1);

var _emscripten_bind_btCapsuleShape_setMargin_1 = Module["_emscripten_bind_btCapsuleShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btCapsuleShape_setMargin_1 = Module["_emscripten_bind_btCapsuleShape_setMargin_1"] = wasmExports["vd"])(a0, a1);

var _emscripten_bind_btCapsuleShape_getMargin_0 = Module["_emscripten_bind_btCapsuleShape_getMargin_0"] = a0 => (_emscripten_bind_btCapsuleShape_getMargin_0 = Module["_emscripten_bind_btCapsuleShape_getMargin_0"] = wasmExports["wd"])(a0);

var _emscripten_bind_btCapsuleShape_getUpAxis_0 = Module["_emscripten_bind_btCapsuleShape_getUpAxis_0"] = a0 => (_emscripten_bind_btCapsuleShape_getUpAxis_0 = Module["_emscripten_bind_btCapsuleShape_getUpAxis_0"] = wasmExports["xd"])(a0);

var _emscripten_bind_btCapsuleShape_getRadius_0 = Module["_emscripten_bind_btCapsuleShape_getRadius_0"] = a0 => (_emscripten_bind_btCapsuleShape_getRadius_0 = Module["_emscripten_bind_btCapsuleShape_getRadius_0"] = wasmExports["yd"])(a0);

var _emscripten_bind_btCapsuleShape_getHalfHeight_0 = Module["_emscripten_bind_btCapsuleShape_getHalfHeight_0"] = a0 => (_emscripten_bind_btCapsuleShape_getHalfHeight_0 = Module["_emscripten_bind_btCapsuleShape_getHalfHeight_0"] = wasmExports["zd"])(a0);

var _emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = wasmExports["Ad"])(a0, a1);

var _emscripten_bind_btCapsuleShape_getLocalScaling_0 = Module["_emscripten_bind_btCapsuleShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btCapsuleShape_getLocalScaling_0 = Module["_emscripten_bind_btCapsuleShape_getLocalScaling_0"] = wasmExports["Bd"])(a0);

var _emscripten_bind_btCapsuleShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCapsuleShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btCapsuleShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCapsuleShape_calculateLocalInertia_2"] = wasmExports["Cd"])(a0, a1, a2);

var _emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = a0 => (_emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = wasmExports["Dd"])(a0);

var _emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = () => (_emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = wasmExports["Ed"])();

var _emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = a0 => (_emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = wasmExports["Fd"])(a0);

var _emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = wasmExports["Gd"])(a0, a1);

var _emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = wasmExports["Hd"])(a0, a1);

var _emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = (a0, a1, a2) => (_emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = wasmExports["Id"])(a0, a1, a2);

var _emscripten_bind_btConvexHullShape_setMargin_1 = Module["_emscripten_bind_btConvexHullShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_setMargin_1 = Module["_emscripten_bind_btConvexHullShape_setMargin_1"] = wasmExports["Jd"])(a0, a1);

var _emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = wasmExports["Kd"])(a0, a1);

var _emscripten_bind_btConvexHullShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexHullShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btConvexHullShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexHullShape_getLocalScaling_0"] = wasmExports["Ld"])(a0);

var _emscripten_bind_btConvexHullShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexHullShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btConvexHullShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexHullShape_calculateLocalInertia_2"] = wasmExports["Md"])(a0, a1, a2);

var _emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = a0 => (_emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = wasmExports["Nd"])(a0);

var _emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = () => (_emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = wasmExports["Od"])();

var _emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = a0 => (_emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = wasmExports["Pd"])(a0);

var _emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = (a0, a1, a2) => (_emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = wasmExports["Qd"])(a0, a1, a2);

var _emscripten_bind_btCompoundShape_setMargin_1 = Module["_emscripten_bind_btCompoundShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btCompoundShape_setMargin_1 = Module["_emscripten_bind_btCompoundShape_setMargin_1"] = wasmExports["Rd"])(a0, a1);

var _emscripten_bind_btCompoundShape_getMargin_0 = Module["_emscripten_bind_btCompoundShape_getMargin_0"] = a0 => (_emscripten_bind_btCompoundShape_getMargin_0 = Module["_emscripten_bind_btCompoundShape_getMargin_0"] = wasmExports["Sd"])(a0);

var _emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = wasmExports["Td"])(a0, a1);

var _emscripten_bind_btCompoundShape_getLocalScaling_0 = Module["_emscripten_bind_btCompoundShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btCompoundShape_getLocalScaling_0 = Module["_emscripten_bind_btCompoundShape_getLocalScaling_0"] = wasmExports["Ud"])(a0);

var _emscripten_bind_btCompoundShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCompoundShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btCompoundShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCompoundShape_calculateLocalInertia_2"] = wasmExports["Vd"])(a0, a1, a2);

var _emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = a0 => (_emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = wasmExports["Wd"])(a0);

var _emscripten_bind_btIndexedMesh_get_m_numTriangles_0 = Module["_emscripten_bind_btIndexedMesh_get_m_numTriangles_0"] = a0 => (_emscripten_bind_btIndexedMesh_get_m_numTriangles_0 = Module["_emscripten_bind_btIndexedMesh_get_m_numTriangles_0"] = wasmExports["Xd"])(a0);

var _emscripten_bind_btIndexedMesh_set_m_numTriangles_1 = Module["_emscripten_bind_btIndexedMesh_set_m_numTriangles_1"] = (a0, a1) => (_emscripten_bind_btIndexedMesh_set_m_numTriangles_1 = Module["_emscripten_bind_btIndexedMesh_set_m_numTriangles_1"] = wasmExports["Yd"])(a0, a1);

var _emscripten_bind_btIndexedMesh___destroy___0 = Module["_emscripten_bind_btIndexedMesh___destroy___0"] = a0 => (_emscripten_bind_btIndexedMesh___destroy___0 = Module["_emscripten_bind_btIndexedMesh___destroy___0"] = wasmExports["Zd"])(a0);

var _emscripten_bind_btIndexedMeshArray_size_0 = Module["_emscripten_bind_btIndexedMeshArray_size_0"] = a0 => (_emscripten_bind_btIndexedMeshArray_size_0 = Module["_emscripten_bind_btIndexedMeshArray_size_0"] = wasmExports["_d"])(a0);

var _emscripten_bind_btIndexedMeshArray_at_1 = Module["_emscripten_bind_btIndexedMeshArray_at_1"] = (a0, a1) => (_emscripten_bind_btIndexedMeshArray_at_1 = Module["_emscripten_bind_btIndexedMeshArray_at_1"] = wasmExports["$d"])(a0, a1);

var _emscripten_bind_btIndexedMeshArray___destroy___0 = Module["_emscripten_bind_btIndexedMeshArray___destroy___0"] = a0 => (_emscripten_bind_btIndexedMeshArray___destroy___0 = Module["_emscripten_bind_btIndexedMeshArray___destroy___0"] = wasmExports["ae"])(a0);

var _emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = () => (_emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = wasmExports["be"])();

var _emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = a0 => (_emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = wasmExports["ce"])(a0);

var _emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = wasmExports["de"])(a0, a1);

var _emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = wasmExports["ee"])(a0, a1, a2, a3);

var _emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = wasmExports["fe"])(a0, a1, a2, a3, a4);

var _emscripten_bind_btTriangleMesh_findOrAddVertex_2 = Module["_emscripten_bind_btTriangleMesh_findOrAddVertex_2"] = (a0, a1, a2) => (_emscripten_bind_btTriangleMesh_findOrAddVertex_2 = Module["_emscripten_bind_btTriangleMesh_findOrAddVertex_2"] = wasmExports["ge"])(a0, a1, a2);

var _emscripten_bind_btTriangleMesh_addIndex_1 = Module["_emscripten_bind_btTriangleMesh_addIndex_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_addIndex_1 = Module["_emscripten_bind_btTriangleMesh_addIndex_1"] = wasmExports["he"])(a0, a1);

var _emscripten_bind_btTriangleMesh_preallocateIndices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateIndices_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_preallocateIndices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateIndices_1"] = wasmExports["ie"])(a0, a1);

var _emscripten_bind_btTriangleMesh_preallocateVertices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateVertices_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_preallocateVertices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateVertices_1"] = wasmExports["je"])(a0, a1);

var _emscripten_bind_btTriangleMesh_getIndexedMeshArray_0 = Module["_emscripten_bind_btTriangleMesh_getIndexedMeshArray_0"] = a0 => (_emscripten_bind_btTriangleMesh_getIndexedMeshArray_0 = Module["_emscripten_bind_btTriangleMesh_getIndexedMeshArray_0"] = wasmExports["ke"])(a0);

var _emscripten_bind_btTriangleMesh_setScaling_1 = Module["_emscripten_bind_btTriangleMesh_setScaling_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_setScaling_1 = Module["_emscripten_bind_btTriangleMesh_setScaling_1"] = wasmExports["le"])(a0, a1);

var _emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = a0 => (_emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = wasmExports["me"])(a0);

var _emscripten_bind_btEmptyShape_btEmptyShape_0 = Module["_emscripten_bind_btEmptyShape_btEmptyShape_0"] = () => (_emscripten_bind_btEmptyShape_btEmptyShape_0 = Module["_emscripten_bind_btEmptyShape_btEmptyShape_0"] = wasmExports["ne"])();

var _emscripten_bind_btEmptyShape_setLocalScaling_1 = Module["_emscripten_bind_btEmptyShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btEmptyShape_setLocalScaling_1 = Module["_emscripten_bind_btEmptyShape_setLocalScaling_1"] = wasmExports["oe"])(a0, a1);

var _emscripten_bind_btEmptyShape_getLocalScaling_0 = Module["_emscripten_bind_btEmptyShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btEmptyShape_getLocalScaling_0 = Module["_emscripten_bind_btEmptyShape_getLocalScaling_0"] = wasmExports["pe"])(a0);

var _emscripten_bind_btEmptyShape_calculateLocalInertia_2 = Module["_emscripten_bind_btEmptyShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btEmptyShape_calculateLocalInertia_2 = Module["_emscripten_bind_btEmptyShape_calculateLocalInertia_2"] = wasmExports["qe"])(a0, a1, a2);

var _emscripten_bind_btEmptyShape___destroy___0 = Module["_emscripten_bind_btEmptyShape___destroy___0"] = a0 => (_emscripten_bind_btEmptyShape___destroy___0 = Module["_emscripten_bind_btEmptyShape___destroy___0"] = wasmExports["re"])(a0);

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = (a0, a1) => (_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = wasmExports["se"])(a0, a1);

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = (a0, a1, a2) => (_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = wasmExports["te"])(a0, a1, a2);

var _emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1"] = wasmExports["ue"])(a0, a1);

var _emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0"] = a0 => (_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0"] = wasmExports["ve"])(a0);

var _emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2"] = wasmExports["we"])(a0, a1, a2);

var _emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = a0 => (_emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = wasmExports["xe"])(a0);

var _emscripten_bind_btAABB_btAABB_4 = Module["_emscripten_bind_btAABB_btAABB_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btAABB_btAABB_4 = Module["_emscripten_bind_btAABB_btAABB_4"] = wasmExports["ye"])(a0, a1, a2, a3);

var _emscripten_bind_btAABB_invalidate_0 = Module["_emscripten_bind_btAABB_invalidate_0"] = a0 => (_emscripten_bind_btAABB_invalidate_0 = Module["_emscripten_bind_btAABB_invalidate_0"] = wasmExports["ze"])(a0);

var _emscripten_bind_btAABB_increment_margin_1 = Module["_emscripten_bind_btAABB_increment_margin_1"] = (a0, a1) => (_emscripten_bind_btAABB_increment_margin_1 = Module["_emscripten_bind_btAABB_increment_margin_1"] = wasmExports["Ae"])(a0, a1);

var _emscripten_bind_btAABB_copy_with_margin_2 = Module["_emscripten_bind_btAABB_copy_with_margin_2"] = (a0, a1, a2) => (_emscripten_bind_btAABB_copy_with_margin_2 = Module["_emscripten_bind_btAABB_copy_with_margin_2"] = wasmExports["Be"])(a0, a1, a2);

var _emscripten_bind_btAABB___destroy___0 = Module["_emscripten_bind_btAABB___destroy___0"] = a0 => (_emscripten_bind_btAABB___destroy___0 = Module["_emscripten_bind_btAABB___destroy___0"] = wasmExports["Ce"])(a0);

var _emscripten_bind_btPrimitiveTriangle___destroy___0 = Module["_emscripten_bind_btPrimitiveTriangle___destroy___0"] = a0 => (_emscripten_bind_btPrimitiveTriangle___destroy___0 = Module["_emscripten_bind_btPrimitiveTriangle___destroy___0"] = wasmExports["De"])(a0);

var _emscripten_bind_btTriangleShapeEx_btTriangleShapeEx_3 = Module["_emscripten_bind_btTriangleShapeEx_btTriangleShapeEx_3"] = (a0, a1, a2) => (_emscripten_bind_btTriangleShapeEx_btTriangleShapeEx_3 = Module["_emscripten_bind_btTriangleShapeEx_btTriangleShapeEx_3"] = wasmExports["Ee"])(a0, a1, a2);

var _emscripten_bind_btTriangleShapeEx_getAabb_3 = Module["_emscripten_bind_btTriangleShapeEx_getAabb_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btTriangleShapeEx_getAabb_3 = Module["_emscripten_bind_btTriangleShapeEx_getAabb_3"] = wasmExports["Fe"])(a0, a1, a2, a3);

var _emscripten_bind_btTriangleShapeEx_applyTransform_1 = Module["_emscripten_bind_btTriangleShapeEx_applyTransform_1"] = (a0, a1) => (_emscripten_bind_btTriangleShapeEx_applyTransform_1 = Module["_emscripten_bind_btTriangleShapeEx_applyTransform_1"] = wasmExports["Ge"])(a0, a1);

var _emscripten_bind_btTriangleShapeEx___destroy___0 = Module["_emscripten_bind_btTriangleShapeEx___destroy___0"] = a0 => (_emscripten_bind_btTriangleShapeEx___destroy___0 = Module["_emscripten_bind_btTriangleShapeEx___destroy___0"] = wasmExports["He"])(a0);

var _emscripten_bind_btPrimitiveManagerBase_is_trimesh_0 = Module["_emscripten_bind_btPrimitiveManagerBase_is_trimesh_0"] = a0 => (_emscripten_bind_btPrimitiveManagerBase_is_trimesh_0 = Module["_emscripten_bind_btPrimitiveManagerBase_is_trimesh_0"] = wasmExports["Ie"])(a0);

var _emscripten_bind_btPrimitiveManagerBase_get_primitive_count_0 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_count_0"] = a0 => (_emscripten_bind_btPrimitiveManagerBase_get_primitive_count_0 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_count_0"] = wasmExports["Je"])(a0);

var _emscripten_bind_btPrimitiveManagerBase_get_primitive_box_2 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_box_2"] = (a0, a1, a2) => (_emscripten_bind_btPrimitiveManagerBase_get_primitive_box_2 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_box_2"] = wasmExports["Ke"])(a0, a1, a2);

var _emscripten_bind_btPrimitiveManagerBase_get_primitive_triangle_2 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_triangle_2"] = (a0, a1, a2) => (_emscripten_bind_btPrimitiveManagerBase_get_primitive_triangle_2 = Module["_emscripten_bind_btPrimitiveManagerBase_get_primitive_triangle_2"] = wasmExports["Le"])(a0, a1, a2);

var _emscripten_bind_btPrimitiveManagerBase___destroy___0 = Module["_emscripten_bind_btPrimitiveManagerBase___destroy___0"] = a0 => (_emscripten_bind_btPrimitiveManagerBase___destroy___0 = Module["_emscripten_bind_btPrimitiveManagerBase___destroy___0"] = wasmExports["Me"])(a0);

var _emscripten_bind_btTetrahedronShapeEx_btTetrahedronShapeEx_0 = Module["_emscripten_bind_btTetrahedronShapeEx_btTetrahedronShapeEx_0"] = () => (_emscripten_bind_btTetrahedronShapeEx_btTetrahedronShapeEx_0 = Module["_emscripten_bind_btTetrahedronShapeEx_btTetrahedronShapeEx_0"] = wasmExports["Ne"])();

var _emscripten_bind_btTetrahedronShapeEx_setVertices_4 = Module["_emscripten_bind_btTetrahedronShapeEx_setVertices_4"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_btTetrahedronShapeEx_setVertices_4 = Module["_emscripten_bind_btTetrahedronShapeEx_setVertices_4"] = wasmExports["Oe"])(a0, a1, a2, a3, a4);

var _emscripten_bind_btTetrahedronShapeEx___destroy___0 = Module["_emscripten_bind_btTetrahedronShapeEx___destroy___0"] = a0 => (_emscripten_bind_btTetrahedronShapeEx___destroy___0 = Module["_emscripten_bind_btTetrahedronShapeEx___destroy___0"] = wasmExports["Pe"])(a0);

var _emscripten_bind_btGImpactShapeInterface_updateBound_0 = Module["_emscripten_bind_btGImpactShapeInterface_updateBound_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_updateBound_0 = Module["_emscripten_bind_btGImpactShapeInterface_updateBound_0"] = wasmExports["Qe"])(a0);

var _emscripten_bind_btGImpactShapeInterface_postUpdate_0 = Module["_emscripten_bind_btGImpactShapeInterface_postUpdate_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_postUpdate_0 = Module["_emscripten_bind_btGImpactShapeInterface_postUpdate_0"] = wasmExports["Re"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getShapeType_0 = Module["_emscripten_bind_btGImpactShapeInterface_getShapeType_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getShapeType_0 = Module["_emscripten_bind_btGImpactShapeInterface_getShapeType_0"] = wasmExports["Se"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getName_0 = Module["_emscripten_bind_btGImpactShapeInterface_getName_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getName_0 = Module["_emscripten_bind_btGImpactShapeInterface_getName_0"] = wasmExports["Te"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getGImpactShapeType_0 = Module["_emscripten_bind_btGImpactShapeInterface_getGImpactShapeType_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getGImpactShapeType_0 = Module["_emscripten_bind_btGImpactShapeInterface_getGImpactShapeType_0"] = wasmExports["Ue"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getPrimitiveManager_0 = Module["_emscripten_bind_btGImpactShapeInterface_getPrimitiveManager_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getPrimitiveManager_0 = Module["_emscripten_bind_btGImpactShapeInterface_getPrimitiveManager_0"] = wasmExports["Ve"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getNumChildShapes_0 = Module["_emscripten_bind_btGImpactShapeInterface_getNumChildShapes_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getNumChildShapes_0 = Module["_emscripten_bind_btGImpactShapeInterface_getNumChildShapes_0"] = wasmExports["We"])(a0);

var _emscripten_bind_btGImpactShapeInterface_childrenHasTransform_0 = Module["_emscripten_bind_btGImpactShapeInterface_childrenHasTransform_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_childrenHasTransform_0 = Module["_emscripten_bind_btGImpactShapeInterface_childrenHasTransform_0"] = wasmExports["Xe"])(a0);

var _emscripten_bind_btGImpactShapeInterface_needsRetrieveTriangles_0 = Module["_emscripten_bind_btGImpactShapeInterface_needsRetrieveTriangles_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_needsRetrieveTriangles_0 = Module["_emscripten_bind_btGImpactShapeInterface_needsRetrieveTriangles_0"] = wasmExports["Ye"])(a0);

var _emscripten_bind_btGImpactShapeInterface_needsRetrieveTetrahedrons_0 = Module["_emscripten_bind_btGImpactShapeInterface_needsRetrieveTetrahedrons_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_needsRetrieveTetrahedrons_0 = Module["_emscripten_bind_btGImpactShapeInterface_needsRetrieveTetrahedrons_0"] = wasmExports["Ze"])(a0);

var _emscripten_bind_btGImpactShapeInterface_getBulletTriangle_2 = Module["_emscripten_bind_btGImpactShapeInterface_getBulletTriangle_2"] = (a0, a1, a2) => (_emscripten_bind_btGImpactShapeInterface_getBulletTriangle_2 = Module["_emscripten_bind_btGImpactShapeInterface_getBulletTriangle_2"] = wasmExports["_e"])(a0, a1, a2);

var _emscripten_bind_btGImpactShapeInterface_getBulletTetrahedron_2 = Module["_emscripten_bind_btGImpactShapeInterface_getBulletTetrahedron_2"] = (a0, a1, a2) => (_emscripten_bind_btGImpactShapeInterface_getBulletTetrahedron_2 = Module["_emscripten_bind_btGImpactShapeInterface_getBulletTetrahedron_2"] = wasmExports["$e"])(a0, a1, a2);

var _emscripten_bind_btGImpactShapeInterface_getChildShape_1 = Module["_emscripten_bind_btGImpactShapeInterface_getChildShape_1"] = (a0, a1) => (_emscripten_bind_btGImpactShapeInterface_getChildShape_1 = Module["_emscripten_bind_btGImpactShapeInterface_getChildShape_1"] = wasmExports["af"])(a0, a1);

var _emscripten_bind_btGImpactShapeInterface_getChildTransform_1 = Module["_emscripten_bind_btGImpactShapeInterface_getChildTransform_1"] = (a0, a1) => (_emscripten_bind_btGImpactShapeInterface_getChildTransform_1 = Module["_emscripten_bind_btGImpactShapeInterface_getChildTransform_1"] = wasmExports["bf"])(a0, a1);

var _emscripten_bind_btGImpactShapeInterface_setChildTransform_2 = Module["_emscripten_bind_btGImpactShapeInterface_setChildTransform_2"] = (a0, a1, a2) => (_emscripten_bind_btGImpactShapeInterface_setChildTransform_2 = Module["_emscripten_bind_btGImpactShapeInterface_setChildTransform_2"] = wasmExports["cf"])(a0, a1, a2);

var _emscripten_bind_btGImpactShapeInterface_setLocalScaling_1 = Module["_emscripten_bind_btGImpactShapeInterface_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btGImpactShapeInterface_setLocalScaling_1 = Module["_emscripten_bind_btGImpactShapeInterface_setLocalScaling_1"] = wasmExports["df"])(a0, a1);

var _emscripten_bind_btGImpactShapeInterface_getLocalScaling_0 = Module["_emscripten_bind_btGImpactShapeInterface_getLocalScaling_0"] = a0 => (_emscripten_bind_btGImpactShapeInterface_getLocalScaling_0 = Module["_emscripten_bind_btGImpactShapeInterface_getLocalScaling_0"] = wasmExports["ef"])(a0);

var _emscripten_bind_btGImpactShapeInterface_calculateLocalInertia_2 = Module["_emscripten_bind_btGImpactShapeInterface_calculateLocalInertia_2"] = (a0, a1, a2) => (_emscripten_bind_btGImpactShapeInterface_calculateLocalInertia_2 = Module["_emscripten_bind_btGImpactShapeInterface_calculateLocalInertia_2"] = wasmExports["ff"])(a0, a1, a2);

var _emscripten_bind_btGImpactShapeInterface___destroy___0 = Module["_emscripten_bind_btGImpactShapeInterface___destroy___0"] = a0 => (_emscripten_bind_btGImpactShapeInterface___destroy___0 = Module["_emscripten_bind_btGImpactShapeInterface___destroy___0"] = wasmExports["gf"])(a0);

var _emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_0"] = () => (_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_0"] = wasmExports["hf"])();

var _emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_2 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_2"] = (a0, a1) => (_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_2 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_2"] = wasmExports["jf"])(a0, a1);

var _emscripten_bind_btCollisionAlgorithmConstructionInfo_get_m_dispatcher1_0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_get_m_dispatcher1_0"] = a0 => (_emscripten_bind_btCollisionAlgorithmConstructionInfo_get_m_dispatcher1_0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_get_m_dispatcher1_0"] = wasmExports["kf"])(a0);

var _emscripten_bind_btCollisionAlgorithmConstructionInfo_set_m_dispatcher1_1 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_set_m_dispatcher1_1"] = (a0, a1) => (_emscripten_bind_btCollisionAlgorithmConstructionInfo_set_m_dispatcher1_1 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo_set_m_dispatcher1_1"] = wasmExports["lf"])(a0, a1);

var _emscripten_bind_btCollisionAlgorithmConstructionInfo___destroy___0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo___destroy___0"] = a0 => (_emscripten_bind_btCollisionAlgorithmConstructionInfo___destroy___0 = Module["_emscripten_bind_btCollisionAlgorithmConstructionInfo___destroy___0"] = wasmExports["mf"])(a0);

var _emscripten_bind_btGImpactCollisionAlgorithm_btGImpactCollisionAlgorithm_3 = Module["_emscripten_bind_btGImpactCollisionAlgorithm_btGImpactCollisionAlgorithm_3"] = (a0, a1, a2) => (_emscripten_bind_btGImpactCollisionAlgorithm_btGImpactCollisionAlgorithm_3 = Module["_emscripten_bind_btGImpactCollisionAlgorithm_btGImpactCollisionAlgorithm_3"] = wasmExports["nf"])(a0, a1, a2);

var _emscripten_bind_btGImpactCollisionAlgorithm_registerAlgorithm_1 = Module["_emscripten_bind_btGImpactCollisionAlgorithm_registerAlgorithm_1"] = (a0, a1) => (_emscripten_bind_btGImpactCollisionAlgorithm_registerAlgorithm_1 = Module["_emscripten_bind_btGImpactCollisionAlgorithm_registerAlgorithm_1"] = wasmExports["of"])(a0, a1);

var _emscripten_bind_btGImpactCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btGImpactCollisionAlgorithm___destroy___0"] = a0 => (_emscripten_bind_btGImpactCollisionAlgorithm___destroy___0 = Module["_emscripten_bind_btGImpactCollisionAlgorithm___destroy___0"] = wasmExports["pf"])(a0);

var _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = () => (_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = wasmExports["qf"])();

var _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = a0 => (_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = wasmExports["rf"])(a0);

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = () => (_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = wasmExports["sf"])();

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = a0 => (_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = wasmExports["tf"])(a0);

var _emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = a0 => (_emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = wasmExports["uf"])(a0);

var _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = a0 => (_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = wasmExports["vf"])(a0);

var _emscripten_bind_btCollisionDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btCollisionDispatcher_getNumManifolds_0"] = a0 => (_emscripten_bind_btCollisionDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btCollisionDispatcher_getNumManifolds_0"] = wasmExports["wf"])(a0);

var _emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = a0 => (_emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = wasmExports["xf"])(a0);

var _emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = a0 => (_emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = wasmExports["yf"])(a0);

var _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = (a0, a1) => (_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = wasmExports["zf"])(a0, a1);

var _emscripten_bind_btOverlappingPairCache_getNumOverlappingPairs_0 = Module["_emscripten_bind_btOverlappingPairCache_getNumOverlappingPairs_0"] = a0 => (_emscripten_bind_btOverlappingPairCache_getNumOverlappingPairs_0 = Module["_emscripten_bind_btOverlappingPairCache_getNumOverlappingPairs_0"] = wasmExports["Af"])(a0);

var _emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = a0 => (_emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = wasmExports["Bf"])(a0);

var _emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0 = Module["_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0"] = a0 => (_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0 = Module["_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0"] = wasmExports["Cf"])(a0);

var _emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = a0 => (_emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = wasmExports["Df"])(a0);

var _emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = a0 => (_emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = wasmExports["Ef"])(a0);

var _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = () => (_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = wasmExports["Ff"])();

var _emscripten_bind_btDbvtBroadphase_optimize_0 = Module["_emscripten_bind_btDbvtBroadphase_optimize_0"] = a0 => (_emscripten_bind_btDbvtBroadphase_optimize_0 = Module["_emscripten_bind_btDbvtBroadphase_optimize_0"] = wasmExports["Gf"])(a0);

var _emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = a0 => (_emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = wasmExports["Hf"])(a0);

var _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0"] = a0 => (_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0"] = wasmExports["If"])(a0);

var _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1"] = (a0, a1) => (_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1"] = wasmExports["Jf"])(a0, a1);

var _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0"] = a0 => (_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0"] = wasmExports["Kf"])(a0);

var _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1"] = (a0, a1) => (_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1"] = wasmExports["Lf"])(a0, a1);

var _emscripten_bind_btBroadphaseProxy___destroy___0 = Module["_emscripten_bind_btBroadphaseProxy___destroy___0"] = a0 => (_emscripten_bind_btBroadphaseProxy___destroy___0 = Module["_emscripten_bind_btBroadphaseProxy___destroy___0"] = wasmExports["Mf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = (a0, a1, a2) => (_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = wasmExports["Nf"])(a0, a1, a2);

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = wasmExports["Of"])(a0, a1, a2, a3);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0"] = wasmExports["Pf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1"] = wasmExports["Qf"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0"] = wasmExports["Rf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1"] = wasmExports["Sf"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0"] = wasmExports["Tf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1"] = wasmExports["Uf"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0"] = wasmExports["Vf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1"] = wasmExports["Wf"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0"] = wasmExports["Xf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1"] = wasmExports["Yf"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0"] = wasmExports["Zf"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1"] = wasmExports["_f"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0"] = wasmExports["$f"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1"] = wasmExports["ag"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0"] = wasmExports["bg"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1"] = wasmExports["cg"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0"] = wasmExports["dg"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1"] = wasmExports["eg"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0"] = wasmExports["fg"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1"] = wasmExports["gg"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0"] = wasmExports["hg"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1"] = wasmExports["ig"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0"] = wasmExports["jg"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1"] = (a0, a1) => (_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1"] = wasmExports["kg"])(a0, a1);

var _emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = wasmExports["lg"])(a0);

var _emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = a0 => (_emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = wasmExports["mg"])(a0);

var _emscripten_bind_btRigidBody_getCenterOfMassTransform_0 = Module["_emscripten_bind_btRigidBody_getCenterOfMassTransform_0"] = a0 => (_emscripten_bind_btRigidBody_getCenterOfMassTransform_0 = Module["_emscripten_bind_btRigidBody_getCenterOfMassTransform_0"] = wasmExports["ng"])(a0);

var _emscripten_bind_btRigidBody_getCollisionShape_0 = Module["_emscripten_bind_btRigidBody_getCollisionShape_0"] = a0 => (_emscripten_bind_btRigidBody_getCollisionShape_0 = Module["_emscripten_bind_btRigidBody_getCollisionShape_0"] = wasmExports["og"])(a0);

var _emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = a0 => (_emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = wasmExports["pg"])(a0);

var _emscripten_bind_btRigidBody_setFriction_1 = Module["_emscripten_bind_btRigidBody_setFriction_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setFriction_1 = Module["_emscripten_bind_btRigidBody_setFriction_1"] = wasmExports["qg"])(a0, a1);

var _emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = a0 => (_emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = wasmExports["rg"])(a0);

var _emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = wasmExports["sg"])(a0, a1);

var _emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = wasmExports["tg"])(a0, a1);

var _emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = wasmExports["ug"])(a0, a1);

var _emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = a0 => (_emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = wasmExports["vg"])(a0);

var _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = () => (_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = wasmExports["wg"])();

var _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = a0 => (_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = wasmExports["xg"])(a0);

var _emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = a0 => (_emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = wasmExports["yg"])(a0);

var _emscripten_bind_btDispatcherInfo_get_m_timeStep_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeStep_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_timeStep_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeStep_0"] = wasmExports["zg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_timeStep_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeStep_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_timeStep_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeStep_1"] = wasmExports["Ag"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_stepCount_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_stepCount_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_stepCount_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_stepCount_0"] = wasmExports["Bg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_stepCount_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_stepCount_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_stepCount_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_stepCount_1"] = wasmExports["Cg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0"] = wasmExports["Dg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1"] = wasmExports["Eg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0"] = wasmExports["Fg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1"] = wasmExports["Gg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_useContinuous_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0"] = wasmExports["Hg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_useContinuous_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useContinuous_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_useContinuous_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useContinuous_1"] = wasmExports["Ig"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0"] = wasmExports["Jg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1"] = wasmExports["Kg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_enableSPU_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0"] = wasmExports["Lg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_enableSPU_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSPU_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_enableSPU_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSPU_1"] = wasmExports["Mg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_useEpa_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useEpa_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_useEpa_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useEpa_0"] = wasmExports["Ng"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_useEpa_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useEpa_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_useEpa_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useEpa_1"] = wasmExports["Og"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0"] = wasmExports["Pg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1"] = wasmExports["Qg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0"] = wasmExports["Rg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1"] = wasmExports["Sg"])(a0, a1);

var _emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0"] = a0 => (_emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0"] = wasmExports["Tg"])(a0);

var _emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1"] = (a0, a1) => (_emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1"] = wasmExports["Ug"])(a0, a1);

var _emscripten_bind_btDispatcherInfo___destroy___0 = Module["_emscripten_bind_btDispatcherInfo___destroy___0"] = a0 => (_emscripten_bind_btDispatcherInfo___destroy___0 = Module["_emscripten_bind_btDispatcherInfo___destroy___0"] = wasmExports["Vg"])(a0);

var _emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0"] = a0 => (_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0"] = wasmExports["Wg"])(a0);

var _emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1"] = (a0, a1) => (_emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1"] = wasmExports["Xg"])(a0, a1);

var _emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0"] = a0 => (_emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0"] = wasmExports["Yg"])(a0);

var _emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1"] = (a0, a1) => (_emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1"] = wasmExports["Zg"])(a0, a1);

var _emscripten_bind_btContactSolverInfo_get_m_numIterations_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_numIterations_0"] = a0 => (_emscripten_bind_btContactSolverInfo_get_m_numIterations_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_numIterations_0"] = wasmExports["_g"])(a0);

var _emscripten_bind_btContactSolverInfo_set_m_numIterations_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_numIterations_1"] = (a0, a1) => (_emscripten_bind_btContactSolverInfo_set_m_numIterations_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_numIterations_1"] = wasmExports["$g"])(a0, a1);

var _emscripten_bind_btContactSolverInfo___destroy___0 = Module["_emscripten_bind_btContactSolverInfo___destroy___0"] = a0 => (_emscripten_bind_btContactSolverInfo___destroy___0 = Module["_emscripten_bind_btContactSolverInfo___destroy___0"] = wasmExports["ah"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = wasmExports["bh"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = wasmExports["ch"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_getGravity_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0"] = wasmExports["dh"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = wasmExports["eh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = wasmExports["fh"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = wasmExports["gh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = wasmExports["hh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = (a0, a1, a2) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = wasmExports["ih"])(a0, a1, a2);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = wasmExports["jh"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = wasmExports["kh"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = wasmExports["lh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = wasmExports["mh"])(a0, a1, a2);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = wasmExports["nh"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = wasmExports["oh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = wasmExports["ph"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = wasmExports["qh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeAction_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeAction_1"] = wasmExports["rh"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0"] = wasmExports["sh"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_1"] = wasmExports["th"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_2"] = (a0, a1, a2) => (_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_2"] = wasmExports["uh"])(a0, a1, a2);

var _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_3"] = wasmExports["vh"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = wasmExports["wh"])(a0);

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = (a0, a1, a2) => (_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = wasmExports["xh"])(a0, a1, a2);

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = wasmExports["yh"])(a0, a1, a2, a3);

var _emscripten_bind_btKinematicCharacterController_setUp_1 = Module["_emscripten_bind_btKinematicCharacterController_setUp_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setUp_1 = Module["_emscripten_bind_btKinematicCharacterController_setUp_1"] = wasmExports["zh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = wasmExports["Ah"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = wasmExports["Bh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_preStep_1 = Module["_emscripten_bind_btKinematicCharacterController_preStep_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_preStep_1 = Module["_emscripten_bind_btKinematicCharacterController_preStep_1"] = wasmExports["Ch"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_playerStep_2 = Module["_emscripten_bind_btKinematicCharacterController_playerStep_2"] = (a0, a1, a2) => (_emscripten_bind_btKinematicCharacterController_playerStep_2 = Module["_emscripten_bind_btKinematicCharacterController_playerStep_2"] = wasmExports["Dh"])(a0, a1, a2);

var _emscripten_bind_btKinematicCharacterController_setFallSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setFallSpeed_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setFallSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setFallSpeed_1"] = wasmExports["Eh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = wasmExports["Fh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1"] = wasmExports["Gh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_canJump_0 = Module["_emscripten_bind_btKinematicCharacterController_canJump_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_canJump_0 = Module["_emscripten_bind_btKinematicCharacterController_canJump_0"] = wasmExports["Hh"])(a0);

var _emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = wasmExports["Ih"])(a0);

var _emscripten_bind_btKinematicCharacterController_jump_1 = Module["_emscripten_bind_btKinematicCharacterController_jump_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_jump_1 = Module["_emscripten_bind_btKinematicCharacterController_jump_1"] = wasmExports["Jh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = wasmExports["Kh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_getGravity_0 = Module["_emscripten_bind_btKinematicCharacterController_getGravity_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_getGravity_0 = Module["_emscripten_bind_btKinematicCharacterController_getGravity_0"] = wasmExports["Lh"])(a0);

var _emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = wasmExports["Mh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1 = Module["_emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1 = Module["_emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1"] = wasmExports["Nh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = wasmExports["Oh"])(a0);

var _emscripten_bind_btKinematicCharacterController_setUpInterpolate_1 = Module["_emscripten_bind_btKinematicCharacterController_setUpInterpolate_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setUpInterpolate_1 = Module["_emscripten_bind_btKinematicCharacterController_setUpInterpolate_1"] = wasmExports["Ph"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1"] = wasmExports["Qh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_getMaxPenetrationDepth_0 = Module["_emscripten_bind_btKinematicCharacterController_getMaxPenetrationDepth_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_getMaxPenetrationDepth_0 = Module["_emscripten_bind_btKinematicCharacterController_getMaxPenetrationDepth_0"] = wasmExports["Rh"])(a0);

var _emscripten_bind_btKinematicCharacterController_setStepHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setStepHeight_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setStepHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setStepHeight_1"] = wasmExports["Sh"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_updateAction_2 = Module["_emscripten_bind_btKinematicCharacterController_updateAction_2"] = (a0, a1, a2) => (_emscripten_bind_btKinematicCharacterController_updateAction_2 = Module["_emscripten_bind_btKinematicCharacterController_updateAction_2"] = wasmExports["Th"])(a0, a1, a2);

var _emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = a0 => (_emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = wasmExports["Uh"])(a0);

var _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = () => (_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = wasmExports["Vh"])();

var _emscripten_bind_btPairCachingGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0"] = wasmExports["Wh"])(a0);

var _emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = wasmExports["Xh"])(a0);

var _emscripten_bind_btPairCachingGhostObject_setFriction_1 = Module["_emscripten_bind_btPairCachingGhostObject_setFriction_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setFriction_1 = Module["_emscripten_bind_btPairCachingGhostObject_setFriction_1"] = wasmExports["Yh"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = wasmExports["Zh"])(a0);

var _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = wasmExports["_h"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = wasmExports["$h"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = wasmExports["ai"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = wasmExports["bi"])(a0);

var _emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1"] = wasmExports["ci"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = a0 => (_emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = wasmExports["di"])(a0);

var _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = () => (_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = wasmExports["ei"])();

var _emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = a0 => (_emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = wasmExports["fi"])(a0);

var _emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = () => (_emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = wasmExports["gi"])();

var _emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = () => (_emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = wasmExports["hi"])();

var _emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = () => (_emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = wasmExports["ii"])();

var _emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = () => (_emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = wasmExports["ji"])();

var _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = () => (_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = wasmExports["ki"])();

var _emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = () => (_emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = wasmExports["li"])();

var _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_COMPOUND_SHAPE = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_COMPOUND_SHAPE"] = () => (_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_COMPOUND_SHAPE = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_COMPOUND_SHAPE"] = wasmExports["mi"])();

var _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE_PART = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE_PART"] = () => (_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE_PART = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE_PART"] = wasmExports["ni"])();

var _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE"] = () => (_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE = Module["_emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE"] = wasmExports["oi"])();

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP"] = () => (_emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP"] = wasmExports["pi"])();

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP"] = () => (_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP"] = wasmExports["qi"])();

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM"] = () => (_emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM"] = wasmExports["ri"])();

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM"] = () => (_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM"] = wasmExports["si"])();

var ___errno_location = () => (___errno_location = wasmExports["__errno_location"])();

var ___start_em_js = Module["___start_em_js"] = 19490;

var ___stop_em_js = Module["___stop_em_js"] = 19588;

Module["addFunction"] = addFunction;

Module["UTF8ToString"] = UTF8ToString;

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run() {
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  readyPromiseResolve(Module);
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

run();

function WrapperObject() {}

WrapperObject.prototype = Object.create(WrapperObject.prototype);

WrapperObject.prototype.constructor = WrapperObject;

WrapperObject.prototype.__class__ = WrapperObject;

WrapperObject.__cache__ = {};

Module["WrapperObject"] = WrapperObject;

function getCache(__class__) {
 return (__class__ || WrapperObject).__cache__;
}

Module["getCache"] = getCache;

function wrapPointer(ptr, __class__) {
 var cache = getCache(__class__);
 var ret = cache[ptr];
 if (ret) return ret;
 ret = Object.create((__class__ || WrapperObject).prototype);
 ret.ptr = ptr;
 return cache[ptr] = ret;
}

Module["wrapPointer"] = wrapPointer;

function castObject(obj, __class__) {
 return wrapPointer(obj.ptr, __class__);
}

Module["castObject"] = castObject;

Module["NULL"] = wrapPointer(0);

function destroy(obj) {
 if (!obj["__destroy__"]) throw "Error: Cannot destroy object. (Did you create it yourself?)";
 obj["__destroy__"]();
 delete getCache(obj.__class__)[obj.ptr];
}

Module["destroy"] = destroy;

function compare(obj1, obj2) {
 return obj1.ptr === obj2.ptr;
}

Module["compare"] = compare;

function getPointer(obj) {
 return obj.ptr;
}

Module["getPointer"] = getPointer;

function getClass(obj) {
 return obj.__class__;
}

Module["getClass"] = getClass;

var ensureCache = {
 buffer: 0,
 size: 0,
 pos: 0,
 temps: [],
 needed: 0,
 prepare() {
  if (ensureCache.needed) {
   for (var i = 0; i < ensureCache.temps.length; i++) {
    Module["_webidl_free"](ensureCache.temps[i]);
   }
   ensureCache.temps.length = 0;
   Module["_webidl_free"](ensureCache.buffer);
   ensureCache.buffer = 0;
   ensureCache.size += ensureCache.needed;
   ensureCache.needed = 0;
  }
  if (!ensureCache.buffer) {
   ensureCache.size += 128;
   ensureCache.buffer = Module["_webidl_malloc"](ensureCache.size);
   assert(ensureCache.buffer);
  }
  ensureCache.pos = 0;
 },
 alloc(array, view) {
  assert(ensureCache.buffer);
  var bytes = view.BYTES_PER_ELEMENT;
  var len = array.length * bytes;
  len = len + 7 & -8;
  var ret;
  if (ensureCache.pos + len >= ensureCache.size) {
   assert(len > 0);
   ensureCache.needed += len;
   ret = Module["_webidl_malloc"](len);
   ensureCache.temps.push(ret);
  } else {
   ret = ensureCache.buffer + ensureCache.pos;
   ensureCache.pos += len;
  }
  return ret;
 },
 copy(array, view, offset) {
  offset >>>= 0;
  var bytes = view.BYTES_PER_ELEMENT;
  switch (bytes) {
  case 2:
   offset >>>= 1;
   break;

  case 4:
   offset >>>= 2;
   break;

  case 8:
   offset >>>= 3;
   break;
  }
  for (var i = 0; i < array.length; i++) {
   view[offset + i] = array[i];
  }
 }
};

function ensureFloat32(value) {
 if (typeof value === "object") {
  var offset = ensureCache.alloc(value, HEAPF32);
  ensureCache.copy(value, HEAPF32, offset);
  return offset;
 }
 return value;
}

function btCollisionShape() {
 throw "cannot construct a btCollisionShape, no constructor in IDL";
}

btCollisionShape.prototype = Object.create(WrapperObject.prototype);

btCollisionShape.prototype.constructor = btCollisionShape;

btCollisionShape.prototype.__class__ = btCollisionShape;

btCollisionShape.__cache__ = {};

Module["btCollisionShape"] = btCollisionShape;

btCollisionShape.prototype["setLocalScaling"] = btCollisionShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btCollisionShape_setLocalScaling_1(self, scaling);
};

btCollisionShape.prototype["getLocalScaling"] = btCollisionShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionShape_getLocalScaling_0(self), btVector3);
};

btCollisionShape.prototype["calculateLocalInertia"] = btCollisionShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btCollisionShape_calculateLocalInertia_2(self, mass, inertia);
};

btCollisionShape.prototype["setMargin"] = btCollisionShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btCollisionShape_setMargin_1(self, margin);
};

btCollisionShape.prototype["getMargin"] = btCollisionShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionShape_getMargin_0(self);
};

btCollisionShape.prototype["__destroy__"] = btCollisionShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionShape___destroy___0(self);
};

function btCollisionObject() {
 throw "cannot construct a btCollisionObject, no constructor in IDL";
}

btCollisionObject.prototype = Object.create(WrapperObject.prototype);

btCollisionObject.prototype.constructor = btCollisionObject;

btCollisionObject.prototype.__class__ = btCollisionObject;

btCollisionObject.__cache__ = {};

Module["btCollisionObject"] = btCollisionObject;

btCollisionObject.prototype["getCollisionShape"] = btCollisionObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObject_getCollisionShape_0(self), btCollisionShape);
};

btCollisionObject.prototype["isStaticObject"] = btCollisionObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isStaticObject_0(self);
};

btCollisionObject.prototype["setFriction"] = btCollisionObject.prototype.setFriction = function(frict) {
 var self = this.ptr;
 if (frict && typeof frict === "object") frict = frict.ptr;
 _emscripten_bind_btCollisionObject_setFriction_1(self, frict);
};

btCollisionObject.prototype["getWorldTransform"] = btCollisionObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObject_getWorldTransform_0(self), btTransform);
};

btCollisionObject.prototype["setCollisionFlags"] = btCollisionObject.prototype.setCollisionFlags = function(flags) {
 var self = this.ptr;
 if (flags && typeof flags === "object") flags = flags.ptr;
 _emscripten_bind_btCollisionObject_setCollisionFlags_1(self, flags);
};

btCollisionObject.prototype["setWorldTransform"] = btCollisionObject.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btCollisionObject_setWorldTransform_1(self, worldTrans);
};

btCollisionObject.prototype["setCollisionShape"] = btCollisionObject.prototype.setCollisionShape = function(collisionShape) {
 var self = this.ptr;
 if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
 _emscripten_bind_btCollisionObject_setCollisionShape_1(self, collisionShape);
};

btCollisionObject.prototype["__destroy__"] = btCollisionObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionObject___destroy___0(self);
};

function btConcaveShape() {
 throw "cannot construct a btConcaveShape, no constructor in IDL";
}

btConcaveShape.prototype = Object.create(btCollisionShape.prototype);

btConcaveShape.prototype.constructor = btConcaveShape;

btConcaveShape.prototype.__class__ = btConcaveShape;

btConcaveShape.__cache__ = {};

Module["btConcaveShape"] = btConcaveShape;

btConcaveShape.prototype["setLocalScaling"] = btConcaveShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConcaveShape_setLocalScaling_1(self, scaling);
};

btConcaveShape.prototype["getLocalScaling"] = btConcaveShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConcaveShape_getLocalScaling_0(self), btVector3);
};

btConcaveShape.prototype["calculateLocalInertia"] = btConcaveShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btConcaveShape_calculateLocalInertia_2(self, mass, inertia);
};

btConcaveShape.prototype["__destroy__"] = btConcaveShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConcaveShape___destroy___0(self);
};

function btCollisionAlgorithm() {
 throw "cannot construct a btCollisionAlgorithm, no constructor in IDL";
}

btCollisionAlgorithm.prototype = Object.create(WrapperObject.prototype);

btCollisionAlgorithm.prototype.constructor = btCollisionAlgorithm;

btCollisionAlgorithm.prototype.__class__ = btCollisionAlgorithm;

btCollisionAlgorithm.__cache__ = {};

Module["btCollisionAlgorithm"] = btCollisionAlgorithm;

btCollisionAlgorithm.prototype["__destroy__"] = btCollisionAlgorithm.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionAlgorithm___destroy___0(self);
};

function btCollisionWorld() {
 throw "cannot construct a btCollisionWorld, no constructor in IDL";
}

btCollisionWorld.prototype = Object.create(WrapperObject.prototype);

btCollisionWorld.prototype.constructor = btCollisionWorld;

btCollisionWorld.prototype.__class__ = btCollisionWorld;

btCollisionWorld.__cache__ = {};

Module["btCollisionWorld"] = btCollisionWorld;

btCollisionWorld.prototype["getDispatcher"] = btCollisionWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getDispatcher_0(self), btDispatcher);
};

btCollisionWorld.prototype["addCollisionObject"] = btCollisionWorld.prototype.addCollisionObject = function(collisionObject, collisionFilterGroup, collisionFilterMask) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 if (collisionFilterGroup && typeof collisionFilterGroup === "object") collisionFilterGroup = collisionFilterGroup.ptr;
 if (collisionFilterMask && typeof collisionFilterMask === "object") collisionFilterMask = collisionFilterMask.ptr;
 if (collisionFilterGroup === undefined) {
  _emscripten_bind_btCollisionWorld_addCollisionObject_1(self, collisionObject);
  return;
 }
 if (collisionFilterMask === undefined) {
  _emscripten_bind_btCollisionWorld_addCollisionObject_2(self, collisionObject, collisionFilterGroup);
  return;
 }
 _emscripten_bind_btCollisionWorld_addCollisionObject_3(self, collisionObject, collisionFilterGroup, collisionFilterMask);
};

btCollisionWorld.prototype["removeCollisionObject"] = btCollisionWorld.prototype.removeCollisionObject = function(collisionObject) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 _emscripten_bind_btCollisionWorld_removeCollisionObject_1(self, collisionObject);
};

btCollisionWorld.prototype["getBroadphase"] = btCollisionWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btCollisionWorld.prototype["__destroy__"] = btCollisionWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionWorld___destroy___0(self);
};

function btVector3(x, y, z) {
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (x === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_0();
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 if (y === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_1(x);
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 if (z === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_2(x, y);
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btVector3_btVector3_3(x, y, z);
 getCache(btVector3)[this.ptr] = this;
}

btVector3.prototype = Object.create(WrapperObject.prototype);

btVector3.prototype.constructor = btVector3;

btVector3.prototype.__class__ = btVector3;

btVector3.__cache__ = {};

Module["btVector3"] = btVector3;

btVector3.prototype["length"] = btVector3.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_length_0(self);
};

btVector3.prototype["x"] = btVector3.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_x_0(self);
};

btVector3.prototype["y"] = btVector3.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_y_0(self);
};

btVector3.prototype["z"] = btVector3.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_z_0(self);
};

btVector3.prototype["setX"] = btVector3.prototype.setX = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 _emscripten_bind_btVector3_setX_1(self, x);
};

btVector3.prototype["setY"] = btVector3.prototype.setY = function(y) {
 var self = this.ptr;
 if (y && typeof y === "object") y = y.ptr;
 _emscripten_bind_btVector3_setY_1(self, y);
};

btVector3.prototype["setZ"] = btVector3.prototype.setZ = function(z) {
 var self = this.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btVector3_setZ_1(self, z);
};

btVector3.prototype["setValue"] = btVector3.prototype.setValue = function(x, y, z) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btVector3_setValue_3(self, x, y, z);
};

btVector3.prototype["normalize"] = btVector3.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3_normalize_0(self);
};

btVector3.prototype["rotate"] = btVector3.prototype.rotate = function(wAxis, angle) {
 var self = this.ptr;
 if (wAxis && typeof wAxis === "object") wAxis = wAxis.ptr;
 if (angle && typeof angle === "object") angle = angle.ptr;
 return wrapPointer(_emscripten_bind_btVector3_rotate_2(self, wAxis, angle), btVector3);
};

btVector3.prototype["dot"] = btVector3.prototype.dot = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return _emscripten_bind_btVector3_dot_1(self, v);
};

btVector3.prototype["op_mul"] = btVector3.prototype.op_mul = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_mul_1(self, x), btVector3);
};

btVector3.prototype["op_add"] = btVector3.prototype.op_add = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_add_1(self, v), btVector3);
};

btVector3.prototype["op_sub"] = btVector3.prototype.op_sub = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_sub_1(self, v), btVector3);
};

btVector3.prototype["__destroy__"] = btVector3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3___destroy___0(self);
};

function btQuadWord() {
 throw "cannot construct a btQuadWord, no constructor in IDL";
}

btQuadWord.prototype = Object.create(WrapperObject.prototype);

btQuadWord.prototype.constructor = btQuadWord;

btQuadWord.prototype.__class__ = btQuadWord;

btQuadWord.__cache__ = {};

Module["btQuadWord"] = btQuadWord;

btQuadWord.prototype["x"] = btQuadWord.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_x_0(self);
};

btQuadWord.prototype["y"] = btQuadWord.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_y_0(self);
};

btQuadWord.prototype["z"] = btQuadWord.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_z_0(self);
};

btQuadWord.prototype["w"] = btQuadWord.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_w_0(self);
};

btQuadWord.prototype["setX"] = btQuadWord.prototype.setX = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 _emscripten_bind_btQuadWord_setX_1(self, x);
};

btQuadWord.prototype["setY"] = btQuadWord.prototype.setY = function(y) {
 var self = this.ptr;
 if (y && typeof y === "object") y = y.ptr;
 _emscripten_bind_btQuadWord_setY_1(self, y);
};

btQuadWord.prototype["setZ"] = btQuadWord.prototype.setZ = function(z) {
 var self = this.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btQuadWord_setZ_1(self, z);
};

btQuadWord.prototype["setW"] = btQuadWord.prototype.setW = function(w) {
 var self = this.ptr;
 if (w && typeof w === "object") w = w.ptr;
 _emscripten_bind_btQuadWord_setW_1(self, w);
};

btQuadWord.prototype["__destroy__"] = btQuadWord.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btQuadWord___destroy___0(self);
};

function btMotionState() {
 throw "cannot construct a btMotionState, no constructor in IDL";
}

btMotionState.prototype = Object.create(WrapperObject.prototype);

btMotionState.prototype.constructor = btMotionState;

btMotionState.prototype.__class__ = btMotionState;

btMotionState.__cache__ = {};

Module["btMotionState"] = btMotionState;

btMotionState.prototype["getWorldTransform"] = btMotionState.prototype.getWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btMotionState_getWorldTransform_1(self, worldTrans);
};

btMotionState.prototype["setWorldTransform"] = btMotionState.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btMotionState_setWorldTransform_1(self, worldTrans);
};

btMotionState.prototype["__destroy__"] = btMotionState.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btMotionState___destroy___0(self);
};

function btConvexShape() {
 throw "cannot construct a btConvexShape, no constructor in IDL";
}

btConvexShape.prototype = Object.create(btCollisionShape.prototype);

btConvexShape.prototype.constructor = btConvexShape;

btConvexShape.prototype.__class__ = btConvexShape;

btConvexShape.__cache__ = {};

Module["btConvexShape"] = btConvexShape;

btConvexShape.prototype["setLocalScaling"] = btConvexShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConvexShape_setLocalScaling_1(self, scaling);
};

btConvexShape.prototype["getLocalScaling"] = btConvexShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexShape_getLocalScaling_0(self), btVector3);
};

btConvexShape.prototype["calculateLocalInertia"] = btConvexShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btConvexShape_calculateLocalInertia_2(self, mass, inertia);
};

btConvexShape.prototype["setMargin"] = btConvexShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btConvexShape_setMargin_1(self, margin);
};

btConvexShape.prototype["getMargin"] = btConvexShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexShape_getMargin_0(self);
};

btConvexShape.prototype["__destroy__"] = btConvexShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexShape___destroy___0(self);
};

function btStridingMeshInterface() {
 throw "cannot construct a btStridingMeshInterface, no constructor in IDL";
}

btStridingMeshInterface.prototype = Object.create(WrapperObject.prototype);

btStridingMeshInterface.prototype.constructor = btStridingMeshInterface;

btStridingMeshInterface.prototype.__class__ = btStridingMeshInterface;

btStridingMeshInterface.__cache__ = {};

Module["btStridingMeshInterface"] = btStridingMeshInterface;

btStridingMeshInterface.prototype["setScaling"] = btStridingMeshInterface.prototype.setScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btStridingMeshInterface_setScaling_1(self, scaling);
};

btStridingMeshInterface.prototype["__destroy__"] = btStridingMeshInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btStridingMeshInterface___destroy___0(self);
};

function btTriangleMeshShape() {
 throw "cannot construct a btTriangleMeshShape, no constructor in IDL";
}

btTriangleMeshShape.prototype = Object.create(btConcaveShape.prototype);

btTriangleMeshShape.prototype.constructor = btTriangleMeshShape;

btTriangleMeshShape.prototype.__class__ = btTriangleMeshShape;

btTriangleMeshShape.__cache__ = {};

Module["btTriangleMeshShape"] = btTriangleMeshShape;

btTriangleMeshShape.prototype["setLocalScaling"] = btTriangleMeshShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btTriangleMeshShape_setLocalScaling_1(self, scaling);
};

btTriangleMeshShape.prototype["getLocalScaling"] = btTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btTriangleMeshShape.prototype["calculateLocalInertia"] = btTriangleMeshShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2(self, mass, inertia);
};

btTriangleMeshShape.prototype["__destroy__"] = btTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleMeshShape___destroy___0(self);
};

function btActivatingCollisionAlgorithm() {
 throw "cannot construct a btActivatingCollisionAlgorithm, no constructor in IDL";
}

btActivatingCollisionAlgorithm.prototype = Object.create(btCollisionAlgorithm.prototype);

btActivatingCollisionAlgorithm.prototype.constructor = btActivatingCollisionAlgorithm;

btActivatingCollisionAlgorithm.prototype.__class__ = btActivatingCollisionAlgorithm;

btActivatingCollisionAlgorithm.__cache__ = {};

Module["btActivatingCollisionAlgorithm"] = btActivatingCollisionAlgorithm;

btActivatingCollisionAlgorithm.prototype["__destroy__"] = btActivatingCollisionAlgorithm.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btActivatingCollisionAlgorithm___destroy___0(self);
};

function btDispatcher() {
 throw "cannot construct a btDispatcher, no constructor in IDL";
}

btDispatcher.prototype = Object.create(WrapperObject.prototype);

btDispatcher.prototype.constructor = btDispatcher;

btDispatcher.prototype.__class__ = btDispatcher;

btDispatcher.__cache__ = {};

Module["btDispatcher"] = btDispatcher;

btDispatcher.prototype["getNumManifolds"] = btDispatcher.prototype.getNumManifolds = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcher_getNumManifolds_0(self);
};

btDispatcher.prototype["__destroy__"] = btDispatcher.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDispatcher___destroy___0(self);
};

function btDynamicsWorld() {
 throw "cannot construct a btDynamicsWorld, no constructor in IDL";
}

btDynamicsWorld.prototype = Object.create(btCollisionWorld.prototype);

btDynamicsWorld.prototype.constructor = btDynamicsWorld;

btDynamicsWorld.prototype.__class__ = btDynamicsWorld;

btDynamicsWorld.__cache__ = {};

Module["btDynamicsWorld"] = btDynamicsWorld;

btDynamicsWorld.prototype["addAction"] = btDynamicsWorld.prototype.addAction = function(action) {
 var self = this.ptr;
 if (action && typeof action === "object") action = action.ptr;
 _emscripten_bind_btDynamicsWorld_addAction_1(self, action);
};

btDynamicsWorld.prototype["removeAction"] = btDynamicsWorld.prototype.removeAction = function(action) {
 var self = this.ptr;
 if (action && typeof action === "object") action = action.ptr;
 _emscripten_bind_btDynamicsWorld_removeAction_1(self, action);
};

btDynamicsWorld.prototype["getSolverInfo"] = btDynamicsWorld.prototype.getSolverInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getSolverInfo_0(self), btContactSolverInfo);
};

btDynamicsWorld.prototype["setInternalTickCallback"] = btDynamicsWorld.prototype.setInternalTickCallback = function(cb, worldUserInfo, isPreTick) {
 var self = this.ptr;
 if (cb && typeof cb === "object") cb = cb.ptr;
 if (worldUserInfo && typeof worldUserInfo === "object") worldUserInfo = worldUserInfo.ptr;
 if (isPreTick && typeof isPreTick === "object") isPreTick = isPreTick.ptr;
 if (worldUserInfo === undefined) {
  _emscripten_bind_btDynamicsWorld_setInternalTickCallback_1(self, cb);
  return;
 }
 if (isPreTick === undefined) {
  _emscripten_bind_btDynamicsWorld_setInternalTickCallback_2(self, cb, worldUserInfo);
  return;
 }
 _emscripten_bind_btDynamicsWorld_setInternalTickCallback_3(self, cb, worldUserInfo, isPreTick);
};

btDynamicsWorld.prototype["getDispatcher"] = btDynamicsWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDynamicsWorld.prototype["addCollisionObject"] = btDynamicsWorld.prototype.addCollisionObject = function(collisionObject, collisionFilterGroup, collisionFilterMask) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 if (collisionFilterGroup && typeof collisionFilterGroup === "object") collisionFilterGroup = collisionFilterGroup.ptr;
 if (collisionFilterMask && typeof collisionFilterMask === "object") collisionFilterMask = collisionFilterMask.ptr;
 if (collisionFilterGroup === undefined) {
  _emscripten_bind_btDynamicsWorld_addCollisionObject_1(self, collisionObject);
  return;
 }
 if (collisionFilterMask === undefined) {
  _emscripten_bind_btDynamicsWorld_addCollisionObject_2(self, collisionObject, collisionFilterGroup);
  return;
 }
 _emscripten_bind_btDynamicsWorld_addCollisionObject_3(self, collisionObject, collisionFilterGroup, collisionFilterMask);
};

btDynamicsWorld.prototype["removeCollisionObject"] = btDynamicsWorld.prototype.removeCollisionObject = function(collisionObject) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 _emscripten_bind_btDynamicsWorld_removeCollisionObject_1(self, collisionObject);
};

btDynamicsWorld.prototype["getBroadphase"] = btDynamicsWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDynamicsWorld.prototype["__destroy__"] = btDynamicsWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDynamicsWorld___destroy___0(self);
};

function btActionInterface() {
 throw "cannot construct a btActionInterface, no constructor in IDL";
}

btActionInterface.prototype = Object.create(WrapperObject.prototype);

btActionInterface.prototype.constructor = btActionInterface;

btActionInterface.prototype.__class__ = btActionInterface;

btActionInterface.__cache__ = {};

Module["btActionInterface"] = btActionInterface;

btActionInterface.prototype["updateAction"] = btActionInterface.prototype.updateAction = function(collisionWorld, deltaTimeStep) {
 var self = this.ptr;
 if (collisionWorld && typeof collisionWorld === "object") collisionWorld = collisionWorld.ptr;
 if (deltaTimeStep && typeof deltaTimeStep === "object") deltaTimeStep = deltaTimeStep.ptr;
 _emscripten_bind_btActionInterface_updateAction_2(self, collisionWorld, deltaTimeStep);
};

btActionInterface.prototype["__destroy__"] = btActionInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btActionInterface___destroy___0(self);
};

function btGhostObject() {
 this.ptr = _emscripten_bind_btGhostObject_btGhostObject_0();
 getCache(btGhostObject)[this.ptr] = this;
}

btGhostObject.prototype = Object.create(btCollisionObject.prototype);

btGhostObject.prototype.constructor = btGhostObject;

btGhostObject.prototype.__class__ = btGhostObject;

btGhostObject.__cache__ = {};

Module["btGhostObject"] = btGhostObject;

btGhostObject.prototype["getNumOverlappingObjects"] = btGhostObject.prototype.getNumOverlappingObjects = function() {
 var self = this.ptr;
 return _emscripten_bind_btGhostObject_getNumOverlappingObjects_0(self);
};

btGhostObject.prototype["getOverlappingObject"] = btGhostObject.prototype.getOverlappingObject = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getOverlappingObject_1(self, index), btCollisionObject);
};

btGhostObject.prototype["getCollisionShape"] = btGhostObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getCollisionShape_0(self), btCollisionShape);
};

btGhostObject.prototype["isStaticObject"] = btGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isStaticObject_0(self);
};

btGhostObject.prototype["setFriction"] = btGhostObject.prototype.setFriction = function(frict) {
 var self = this.ptr;
 if (frict && typeof frict === "object") frict = frict.ptr;
 _emscripten_bind_btGhostObject_setFriction_1(self, frict);
};

btGhostObject.prototype["getWorldTransform"] = btGhostObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getWorldTransform_0(self), btTransform);
};

btGhostObject.prototype["setCollisionFlags"] = btGhostObject.prototype.setCollisionFlags = function(flags) {
 var self = this.ptr;
 if (flags && typeof flags === "object") flags = flags.ptr;
 _emscripten_bind_btGhostObject_setCollisionFlags_1(self, flags);
};

btGhostObject.prototype["setWorldTransform"] = btGhostObject.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btGhostObject_setWorldTransform_1(self, worldTrans);
};

btGhostObject.prototype["setCollisionShape"] = btGhostObject.prototype.setCollisionShape = function(collisionShape) {
 var self = this.ptr;
 if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
 _emscripten_bind_btGhostObject_setCollisionShape_1(self, collisionShape);
};

btGhostObject.prototype["__destroy__"] = btGhostObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGhostObject___destroy___0(self);
};

function VoidPtr() {
 throw "cannot construct a VoidPtr, no constructor in IDL";
}

VoidPtr.prototype = Object.create(WrapperObject.prototype);

VoidPtr.prototype.constructor = VoidPtr;

VoidPtr.prototype.__class__ = VoidPtr;

VoidPtr.__cache__ = {};

Module["VoidPtr"] = VoidPtr;

VoidPtr.prototype["__destroy__"] = VoidPtr.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_VoidPtr___destroy___0(self);
};

function btVector4(x, y, z, w) {
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (w && typeof w === "object") w = w.ptr;
 if (x === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_0();
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (y === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_1(x);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (z === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_2(x, y);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (w === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_3(x, y, z);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btVector4_btVector4_4(x, y, z, w);
 getCache(btVector4)[this.ptr] = this;
}

btVector4.prototype = Object.create(btVector3.prototype);

btVector4.prototype.constructor = btVector4;

btVector4.prototype.__class__ = btVector4;

btVector4.__cache__ = {};

Module["btVector4"] = btVector4;

btVector4.prototype["w"] = btVector4.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_w_0(self);
};

btVector4.prototype["setValue"] = btVector4.prototype.setValue = function(x, y, z, w) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (w && typeof w === "object") w = w.ptr;
 _emscripten_bind_btVector4_setValue_4(self, x, y, z, w);
};

btVector4.prototype["length"] = btVector4.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_length_0(self);
};

btVector4.prototype["x"] = btVector4.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_x_0(self);
};

btVector4.prototype["y"] = btVector4.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_y_0(self);
};

btVector4.prototype["z"] = btVector4.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_z_0(self);
};

btVector4.prototype["setX"] = btVector4.prototype.setX = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 _emscripten_bind_btVector4_setX_1(self, x);
};

btVector4.prototype["setY"] = btVector4.prototype.setY = function(y) {
 var self = this.ptr;
 if (y && typeof y === "object") y = y.ptr;
 _emscripten_bind_btVector4_setY_1(self, y);
};

btVector4.prototype["setZ"] = btVector4.prototype.setZ = function(z) {
 var self = this.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btVector4_setZ_1(self, z);
};

btVector4.prototype["normalize"] = btVector4.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btVector4_normalize_0(self);
};

btVector4.prototype["rotate"] = btVector4.prototype.rotate = function(wAxis, angle) {
 var self = this.ptr;
 if (wAxis && typeof wAxis === "object") wAxis = wAxis.ptr;
 if (angle && typeof angle === "object") angle = angle.ptr;
 return wrapPointer(_emscripten_bind_btVector4_rotate_2(self, wAxis, angle), btVector3);
};

btVector4.prototype["dot"] = btVector4.prototype.dot = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return _emscripten_bind_btVector4_dot_1(self, v);
};

btVector4.prototype["op_mul"] = btVector4.prototype.op_mul = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_mul_1(self, x), btVector3);
};

btVector4.prototype["op_add"] = btVector4.prototype.op_add = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_add_1(self, v), btVector3);
};

btVector4.prototype["op_sub"] = btVector4.prototype.op_sub = function(v) {
 var self = this.ptr;
 if (v && typeof v === "object") v = v.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_sub_1(self, v), btVector3);
};

btVector4.prototype["__destroy__"] = btVector4.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector4___destroy___0(self);
};

function btQuaternion(x, y, z, w) {
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (w && typeof w === "object") w = w.ptr;
 this.ptr = _emscripten_bind_btQuaternion_btQuaternion_4(x, y, z, w);
 getCache(btQuaternion)[this.ptr] = this;
}

btQuaternion.prototype = Object.create(btQuadWord.prototype);

btQuaternion.prototype.constructor = btQuaternion;

btQuaternion.prototype.__class__ = btQuaternion;

btQuaternion.__cache__ = {};

Module["btQuaternion"] = btQuaternion;

btQuaternion.prototype["setValue"] = btQuaternion.prototype.setValue = function(x, y, z, w) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (w && typeof w === "object") w = w.ptr;
 _emscripten_bind_btQuaternion_setValue_4(self, x, y, z, w);
};

btQuaternion.prototype["setEulerZYX"] = btQuaternion.prototype.setEulerZYX = function(z, y, x) {
 var self = this.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (x && typeof x === "object") x = x.ptr;
 _emscripten_bind_btQuaternion_setEulerZYX_3(self, z, y, x);
};

btQuaternion.prototype["setRotation"] = btQuaternion.prototype.setRotation = function(axis, angle) {
 var self = this.ptr;
 if (axis && typeof axis === "object") axis = axis.ptr;
 if (angle && typeof angle === "object") angle = angle.ptr;
 _emscripten_bind_btQuaternion_setRotation_2(self, axis, angle);
};

btQuaternion.prototype["normalize"] = btQuaternion.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btQuaternion_normalize_0(self);
};

btQuaternion.prototype["length2"] = btQuaternion.prototype.length2 = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_length2_0(self);
};

btQuaternion.prototype["length"] = btQuaternion.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_length_0(self);
};

btQuaternion.prototype["dot"] = btQuaternion.prototype.dot = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return _emscripten_bind_btQuaternion_dot_1(self, q);
};

btQuaternion.prototype["normalized"] = btQuaternion.prototype.normalized = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_normalized_0(self), btQuaternion);
};

btQuaternion.prototype["getAxis"] = btQuaternion.prototype.getAxis = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_getAxis_0(self), btVector3);
};

btQuaternion.prototype["inverse"] = btQuaternion.prototype.inverse = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_inverse_0(self), btQuaternion);
};

btQuaternion.prototype["getAngle"] = btQuaternion.prototype.getAngle = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_getAngle_0(self);
};

btQuaternion.prototype["getAngleShortestPath"] = btQuaternion.prototype.getAngleShortestPath = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_getAngleShortestPath_0(self);
};

btQuaternion.prototype["angle"] = btQuaternion.prototype.angle = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return _emscripten_bind_btQuaternion_angle_1(self, q);
};

btQuaternion.prototype["angleShortestPath"] = btQuaternion.prototype.angleShortestPath = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return _emscripten_bind_btQuaternion_angleShortestPath_1(self, q);
};

btQuaternion.prototype["op_add"] = btQuaternion.prototype.op_add = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_add_1(self, q), btQuaternion);
};

btQuaternion.prototype["op_sub"] = btQuaternion.prototype.op_sub = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_sub_1(self, q), btQuaternion);
};

btQuaternion.prototype["op_mul"] = btQuaternion.prototype.op_mul = function(s) {
 var self = this.ptr;
 if (s && typeof s === "object") s = s.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_mul_1(self, s), btQuaternion);
};

btQuaternion.prototype["op_mulq"] = btQuaternion.prototype.op_mulq = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_mulq_1(self, q), btQuaternion);
};

btQuaternion.prototype["op_div"] = btQuaternion.prototype.op_div = function(s) {
 var self = this.ptr;
 if (s && typeof s === "object") s = s.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_div_1(self, s), btQuaternion);
};

btQuaternion.prototype["x"] = btQuaternion.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_x_0(self);
};

btQuaternion.prototype["y"] = btQuaternion.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_y_0(self);
};

btQuaternion.prototype["z"] = btQuaternion.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_z_0(self);
};

btQuaternion.prototype["w"] = btQuaternion.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_w_0(self);
};

btQuaternion.prototype["setX"] = btQuaternion.prototype.setX = function(x) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 _emscripten_bind_btQuaternion_setX_1(self, x);
};

btQuaternion.prototype["setY"] = btQuaternion.prototype.setY = function(y) {
 var self = this.ptr;
 if (y && typeof y === "object") y = y.ptr;
 _emscripten_bind_btQuaternion_setY_1(self, y);
};

btQuaternion.prototype["setZ"] = btQuaternion.prototype.setZ = function(z) {
 var self = this.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btQuaternion_setZ_1(self, z);
};

btQuaternion.prototype["setW"] = btQuaternion.prototype.setW = function(w) {
 var self = this.ptr;
 if (w && typeof w === "object") w = w.ptr;
 _emscripten_bind_btQuaternion_setW_1(self, w);
};

btQuaternion.prototype["__destroy__"] = btQuaternion.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btQuaternion___destroy___0(self);
};

function btMatrix3x3() {
 throw "cannot construct a btMatrix3x3, no constructor in IDL";
}

btMatrix3x3.prototype = Object.create(WrapperObject.prototype);

btMatrix3x3.prototype.constructor = btMatrix3x3;

btMatrix3x3.prototype.__class__ = btMatrix3x3;

btMatrix3x3.__cache__ = {};

Module["btMatrix3x3"] = btMatrix3x3;

btMatrix3x3.prototype["setEulerZYX"] = btMatrix3x3.prototype.setEulerZYX = function(ex, ey, ez) {
 var self = this.ptr;
 if (ex && typeof ex === "object") ex = ex.ptr;
 if (ey && typeof ey === "object") ey = ey.ptr;
 if (ez && typeof ez === "object") ez = ez.ptr;
 _emscripten_bind_btMatrix3x3_setEulerZYX_3(self, ex, ey, ez);
};

btMatrix3x3.prototype["getRotation"] = btMatrix3x3.prototype.getRotation = function(q) {
 var self = this.ptr;
 if (q && typeof q === "object") q = q.ptr;
 _emscripten_bind_btMatrix3x3_getRotation_1(self, q);
};

btMatrix3x3.prototype["getRow"] = btMatrix3x3.prototype.getRow = function(y) {
 var self = this.ptr;
 if (y && typeof y === "object") y = y.ptr;
 return wrapPointer(_emscripten_bind_btMatrix3x3_getRow_1(self, y), btVector3);
};

btMatrix3x3.prototype["__destroy__"] = btMatrix3x3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btMatrix3x3___destroy___0(self);
};

function btTransform(q, v) {
 if (q && typeof q === "object") q = q.ptr;
 if (v && typeof v === "object") v = v.ptr;
 if (q === undefined) {
  this.ptr = _emscripten_bind_btTransform_btTransform_0();
  getCache(btTransform)[this.ptr] = this;
  return;
 }
 if (v === undefined) {
  this.ptr = _emscripten_bind_btTransform_btTransform_1(q);
  getCache(btTransform)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btTransform_btTransform_2(q, v);
 getCache(btTransform)[this.ptr] = this;
}

btTransform.prototype = Object.create(WrapperObject.prototype);

btTransform.prototype.constructor = btTransform;

btTransform.prototype.__class__ = btTransform;

btTransform.__cache__ = {};

Module["btTransform"] = btTransform;

btTransform.prototype["setIdentity"] = btTransform.prototype.setIdentity = function() {
 var self = this.ptr;
 _emscripten_bind_btTransform_setIdentity_0(self);
};

btTransform.prototype["setOrigin"] = btTransform.prototype.setOrigin = function(origin) {
 var self = this.ptr;
 if (origin && typeof origin === "object") origin = origin.ptr;
 _emscripten_bind_btTransform_setOrigin_1(self, origin);
};

btTransform.prototype["setRotation"] = btTransform.prototype.setRotation = function(rotation) {
 var self = this.ptr;
 if (rotation && typeof rotation === "object") rotation = rotation.ptr;
 _emscripten_bind_btTransform_setRotation_1(self, rotation);
};

btTransform.prototype["getOrigin"] = btTransform.prototype.getOrigin = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getOrigin_0(self), btVector3);
};

btTransform.prototype["getRotation"] = btTransform.prototype.getRotation = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getRotation_0(self), btQuaternion);
};

btTransform.prototype["getBasis"] = btTransform.prototype.getBasis = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getBasis_0(self), btMatrix3x3);
};

btTransform.prototype["inverse"] = btTransform.prototype.inverse = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_inverse_0(self), btTransform);
};

btTransform.prototype["op_mul"] = btTransform.prototype.op_mul = function(t) {
 var self = this.ptr;
 if (t && typeof t === "object") t = t.ptr;
 return wrapPointer(_emscripten_bind_btTransform_op_mul_1(self, t), btTransform);
};

btTransform.prototype["__destroy__"] = btTransform.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTransform___destroy___0(self);
};

function btDefaultMotionState(startTrans, centerOfMassOffset) {
 if (startTrans && typeof startTrans === "object") startTrans = startTrans.ptr;
 if (centerOfMassOffset && typeof centerOfMassOffset === "object") centerOfMassOffset = centerOfMassOffset.ptr;
 if (startTrans === undefined) {
  this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0();
  getCache(btDefaultMotionState)[this.ptr] = this;
  return;
 }
 if (centerOfMassOffset === undefined) {
  this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1(startTrans);
  getCache(btDefaultMotionState)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2(startTrans, centerOfMassOffset);
 getCache(btDefaultMotionState)[this.ptr] = this;
}

btDefaultMotionState.prototype = Object.create(btMotionState.prototype);

btDefaultMotionState.prototype.constructor = btDefaultMotionState;

btDefaultMotionState.prototype.__class__ = btDefaultMotionState;

btDefaultMotionState.__cache__ = {};

Module["btDefaultMotionState"] = btDefaultMotionState;

btDefaultMotionState.prototype["getWorldTransform"] = btDefaultMotionState.prototype.getWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btDefaultMotionState_getWorldTransform_1(self, worldTrans);
};

btDefaultMotionState.prototype["setWorldTransform"] = btDefaultMotionState.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btDefaultMotionState_setWorldTransform_1(self, worldTrans);
};

btDefaultMotionState.prototype["get_m_graphicsWorldTrans"] = btDefaultMotionState.prototype.get_m_graphicsWorldTrans = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0(self), btTransform);
};

btDefaultMotionState.prototype["set_m_graphicsWorldTrans"] = btDefaultMotionState.prototype.set_m_graphicsWorldTrans = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1(self, arg0);
};

Object.defineProperty(btDefaultMotionState.prototype, "m_graphicsWorldTrans", {
 get: btDefaultMotionState.prototype.get_m_graphicsWorldTrans,
 set: btDefaultMotionState.prototype.set_m_graphicsWorldTrans
});

btDefaultMotionState.prototype["__destroy__"] = btDefaultMotionState.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultMotionState___destroy___0(self);
};

function btCollisionObjectWrapper() {
 throw "cannot construct a btCollisionObjectWrapper, no constructor in IDL";
}

btCollisionObjectWrapper.prototype = Object.create(WrapperObject.prototype);

btCollisionObjectWrapper.prototype.constructor = btCollisionObjectWrapper;

btCollisionObjectWrapper.prototype.__class__ = btCollisionObjectWrapper;

btCollisionObjectWrapper.__cache__ = {};

Module["btCollisionObjectWrapper"] = btCollisionObjectWrapper;

btCollisionObjectWrapper.prototype["getWorldTransform"] = btCollisionObjectWrapper.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObjectWrapper_getWorldTransform_0(self), btTransform);
};

btCollisionObjectWrapper.prototype["getCollisionObject"] = btCollisionObjectWrapper.prototype.getCollisionObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObjectWrapper_getCollisionObject_0(self), btCollisionObject);
};

btCollisionObjectWrapper.prototype["getCollisionShape"] = btCollisionObjectWrapper.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObjectWrapper_getCollisionShape_0(self), btCollisionShape);
};

function btManifoldPoint() {
 throw "cannot construct a btManifoldPoint, no constructor in IDL";
}

btManifoldPoint.prototype = Object.create(WrapperObject.prototype);

btManifoldPoint.prototype.constructor = btManifoldPoint;

btManifoldPoint.prototype.__class__ = btManifoldPoint;

btManifoldPoint.__cache__ = {};

Module["btManifoldPoint"] = btManifoldPoint;

btManifoldPoint.prototype["getPositionWorldOnA"] = btManifoldPoint.prototype.getPositionWorldOnA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0(self), btVector3);
};

btManifoldPoint.prototype["getPositionWorldOnB"] = btManifoldPoint.prototype.getPositionWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["getAppliedImpulse"] = btManifoldPoint.prototype.getAppliedImpulse = function() {
 var self = this.ptr;
 return _emscripten_bind_btManifoldPoint_getAppliedImpulse_0(self);
};

btManifoldPoint.prototype["getDistance"] = btManifoldPoint.prototype.getDistance = function() {
 var self = this.ptr;
 return _emscripten_bind_btManifoldPoint_getDistance_0(self);
};

btManifoldPoint.prototype["get_m_localPointA"] = btManifoldPoint.prototype.get_m_localPointA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_localPointA_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_localPointA"] = btManifoldPoint.prototype.set_m_localPointA = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_localPointA_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_localPointA", {
 get: btManifoldPoint.prototype.get_m_localPointA,
 set: btManifoldPoint.prototype.set_m_localPointA
});

btManifoldPoint.prototype["get_m_localPointB"] = btManifoldPoint.prototype.get_m_localPointB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_localPointB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_localPointB"] = btManifoldPoint.prototype.set_m_localPointB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_localPointB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_localPointB", {
 get: btManifoldPoint.prototype.get_m_localPointB,
 set: btManifoldPoint.prototype.set_m_localPointB
});

btManifoldPoint.prototype["get_m_positionWorldOnB"] = btManifoldPoint.prototype.get_m_positionWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_positionWorldOnB"] = btManifoldPoint.prototype.set_m_positionWorldOnB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_positionWorldOnB", {
 get: btManifoldPoint.prototype.get_m_positionWorldOnB,
 set: btManifoldPoint.prototype.set_m_positionWorldOnB
});

btManifoldPoint.prototype["get_m_positionWorldOnA"] = btManifoldPoint.prototype.get_m_positionWorldOnA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_positionWorldOnA"] = btManifoldPoint.prototype.set_m_positionWorldOnA = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_positionWorldOnA", {
 get: btManifoldPoint.prototype.get_m_positionWorldOnA,
 set: btManifoldPoint.prototype.set_m_positionWorldOnA
});

btManifoldPoint.prototype["get_m_normalWorldOnB"] = btManifoldPoint.prototype.get_m_normalWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_normalWorldOnB"] = btManifoldPoint.prototype.set_m_normalWorldOnB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_normalWorldOnB", {
 get: btManifoldPoint.prototype.get_m_normalWorldOnB,
 set: btManifoldPoint.prototype.set_m_normalWorldOnB
});

btManifoldPoint.prototype["get_m_userPersistentData"] = btManifoldPoint.prototype.get_m_userPersistentData = function() {
 var self = this.ptr;
 return _emscripten_bind_btManifoldPoint_get_m_userPersistentData_0(self);
};

btManifoldPoint.prototype["set_m_userPersistentData"] = btManifoldPoint.prototype.set_m_userPersistentData = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_userPersistentData_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_userPersistentData", {
 get: btManifoldPoint.prototype.get_m_userPersistentData,
 set: btManifoldPoint.prototype.set_m_userPersistentData
});

btManifoldPoint.prototype["__destroy__"] = btManifoldPoint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btManifoldPoint___destroy___0(self);
};

function LocalShapeInfo() {
 throw "cannot construct a LocalShapeInfo, no constructor in IDL";
}

LocalShapeInfo.prototype = Object.create(WrapperObject.prototype);

LocalShapeInfo.prototype.constructor = LocalShapeInfo;

LocalShapeInfo.prototype.__class__ = LocalShapeInfo;

LocalShapeInfo.__cache__ = {};

Module["LocalShapeInfo"] = LocalShapeInfo;

LocalShapeInfo.prototype["get_m_shapePart"] = LocalShapeInfo.prototype.get_m_shapePart = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalShapeInfo_get_m_shapePart_0(self);
};

LocalShapeInfo.prototype["set_m_shapePart"] = LocalShapeInfo.prototype.set_m_shapePart = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalShapeInfo_set_m_shapePart_1(self, arg0);
};

Object.defineProperty(LocalShapeInfo.prototype, "m_shapePart", {
 get: LocalShapeInfo.prototype.get_m_shapePart,
 set: LocalShapeInfo.prototype.set_m_shapePart
});

LocalShapeInfo.prototype["get_m_triangleIndex"] = LocalShapeInfo.prototype.get_m_triangleIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0(self);
};

LocalShapeInfo.prototype["set_m_triangleIndex"] = LocalShapeInfo.prototype.set_m_triangleIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1(self, arg0);
};

Object.defineProperty(LocalShapeInfo.prototype, "m_triangleIndex", {
 get: LocalShapeInfo.prototype.get_m_triangleIndex,
 set: LocalShapeInfo.prototype.set_m_triangleIndex
});

LocalShapeInfo.prototype["__destroy__"] = LocalShapeInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_LocalShapeInfo___destroy___0(self);
};

function LocalConvexResult(hitCollisionObject, localShapeInfo, hitNormalLocal, hitPointLocal, hitFraction) {
 if (hitCollisionObject && typeof hitCollisionObject === "object") hitCollisionObject = hitCollisionObject.ptr;
 if (localShapeInfo && typeof localShapeInfo === "object") localShapeInfo = localShapeInfo.ptr;
 if (hitNormalLocal && typeof hitNormalLocal === "object") hitNormalLocal = hitNormalLocal.ptr;
 if (hitPointLocal && typeof hitPointLocal === "object") hitPointLocal = hitPointLocal.ptr;
 if (hitFraction && typeof hitFraction === "object") hitFraction = hitFraction.ptr;
 this.ptr = _emscripten_bind_LocalConvexResult_LocalConvexResult_5(hitCollisionObject, localShapeInfo, hitNormalLocal, hitPointLocal, hitFraction);
 getCache(LocalConvexResult)[this.ptr] = this;
}

LocalConvexResult.prototype = Object.create(WrapperObject.prototype);

LocalConvexResult.prototype.constructor = LocalConvexResult;

LocalConvexResult.prototype.__class__ = LocalConvexResult;

LocalConvexResult.__cache__ = {};

Module["LocalConvexResult"] = LocalConvexResult;

LocalConvexResult.prototype["get_m_hitCollisionObject"] = LocalConvexResult.prototype.get_m_hitCollisionObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0(self), btCollisionObject);
};

LocalConvexResult.prototype["set_m_hitCollisionObject"] = LocalConvexResult.prototype.set_m_hitCollisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitCollisionObject", {
 get: LocalConvexResult.prototype.get_m_hitCollisionObject,
 set: LocalConvexResult.prototype.set_m_hitCollisionObject
});

LocalConvexResult.prototype["get_m_localShapeInfo"] = LocalConvexResult.prototype.get_m_localShapeInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0(self), LocalShapeInfo);
};

LocalConvexResult.prototype["set_m_localShapeInfo"] = LocalConvexResult.prototype.set_m_localShapeInfo = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_localShapeInfo", {
 get: LocalConvexResult.prototype.get_m_localShapeInfo,
 set: LocalConvexResult.prototype.set_m_localShapeInfo
});

LocalConvexResult.prototype["get_m_hitNormalLocal"] = LocalConvexResult.prototype.get_m_hitNormalLocal = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0(self), btVector3);
};

LocalConvexResult.prototype["set_m_hitNormalLocal"] = LocalConvexResult.prototype.set_m_hitNormalLocal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitNormalLocal", {
 get: LocalConvexResult.prototype.get_m_hitNormalLocal,
 set: LocalConvexResult.prototype.set_m_hitNormalLocal
});

LocalConvexResult.prototype["get_m_hitPointLocal"] = LocalConvexResult.prototype.get_m_hitPointLocal = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0(self), btVector3);
};

LocalConvexResult.prototype["set_m_hitPointLocal"] = LocalConvexResult.prototype.set_m_hitPointLocal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitPointLocal", {
 get: LocalConvexResult.prototype.get_m_hitPointLocal,
 set: LocalConvexResult.prototype.set_m_hitPointLocal
});

LocalConvexResult.prototype["get_m_hitFraction"] = LocalConvexResult.prototype.get_m_hitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalConvexResult_get_m_hitFraction_0(self);
};

LocalConvexResult.prototype["set_m_hitFraction"] = LocalConvexResult.prototype.set_m_hitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitFraction_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitFraction", {
 get: LocalConvexResult.prototype.get_m_hitFraction,
 set: LocalConvexResult.prototype.set_m_hitFraction
});

LocalConvexResult.prototype["__destroy__"] = LocalConvexResult.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_LocalConvexResult___destroy___0(self);
};

function ConvexResultCallback() {
 throw "cannot construct a ConvexResultCallback, no constructor in IDL";
}

ConvexResultCallback.prototype = Object.create(WrapperObject.prototype);

ConvexResultCallback.prototype.constructor = ConvexResultCallback;

ConvexResultCallback.prototype.__class__ = ConvexResultCallback;

ConvexResultCallback.__cache__ = {};

Module["ConvexResultCallback"] = ConvexResultCallback;

ConvexResultCallback.prototype["hasHit"] = ConvexResultCallback.prototype.hasHit = function() {
 var self = this.ptr;
 return !!_emscripten_bind_ConvexResultCallback_hasHit_0(self);
};

ConvexResultCallback.prototype["get_m_collisionFilterGroup"] = ConvexResultCallback.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0(self);
};

ConvexResultCallback.prototype["set_m_collisionFilterGroup"] = ConvexResultCallback.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_collisionFilterGroup", {
 get: ConvexResultCallback.prototype.get_m_collisionFilterGroup,
 set: ConvexResultCallback.prototype.set_m_collisionFilterGroup
});

ConvexResultCallback.prototype["get_m_collisionFilterMask"] = ConvexResultCallback.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0(self);
};

ConvexResultCallback.prototype["set_m_collisionFilterMask"] = ConvexResultCallback.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_collisionFilterMask", {
 get: ConvexResultCallback.prototype.get_m_collisionFilterMask,
 set: ConvexResultCallback.prototype.set_m_collisionFilterMask
});

ConvexResultCallback.prototype["get_m_closestHitFraction"] = ConvexResultCallback.prototype.get_m_closestHitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0(self);
};

ConvexResultCallback.prototype["set_m_closestHitFraction"] = ConvexResultCallback.prototype.set_m_closestHitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_closestHitFraction", {
 get: ConvexResultCallback.prototype.get_m_closestHitFraction,
 set: ConvexResultCallback.prototype.set_m_closestHitFraction
});

ConvexResultCallback.prototype["__destroy__"] = ConvexResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ConvexResultCallback___destroy___0(self);
};

function btConvexTriangleMeshShape(meshInterface, calcAabb) {
 if (meshInterface && typeof meshInterface === "object") meshInterface = meshInterface.ptr;
 if (calcAabb && typeof calcAabb === "object") calcAabb = calcAabb.ptr;
 if (calcAabb === undefined) {
  this.ptr = _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1(meshInterface);
  getCache(btConvexTriangleMeshShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2(meshInterface, calcAabb);
 getCache(btConvexTriangleMeshShape)[this.ptr] = this;
}

btConvexTriangleMeshShape.prototype = Object.create(btConvexShape.prototype);

btConvexTriangleMeshShape.prototype.constructor = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.prototype.__class__ = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.__cache__ = {};

Module["btConvexTriangleMeshShape"] = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.prototype["setLocalScaling"] = btConvexTriangleMeshShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1(self, scaling);
};

btConvexTriangleMeshShape.prototype["getLocalScaling"] = btConvexTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btConvexTriangleMeshShape.prototype["calculateLocalInertia"] = btConvexTriangleMeshShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2(self, mass, inertia);
};

btConvexTriangleMeshShape.prototype["setMargin"] = btConvexTriangleMeshShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_setMargin_1(self, margin);
};

btConvexTriangleMeshShape.prototype["getMargin"] = btConvexTriangleMeshShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexTriangleMeshShape_getMargin_0(self);
};

btConvexTriangleMeshShape.prototype["__destroy__"] = btConvexTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexTriangleMeshShape___destroy___0(self);
};

function btBoxShape(boxHalfExtents) {
 if (boxHalfExtents && typeof boxHalfExtents === "object") boxHalfExtents = boxHalfExtents.ptr;
 this.ptr = _emscripten_bind_btBoxShape_btBoxShape_1(boxHalfExtents);
 getCache(btBoxShape)[this.ptr] = this;
}

btBoxShape.prototype = Object.create(btCollisionShape.prototype);

btBoxShape.prototype.constructor = btBoxShape;

btBoxShape.prototype.__class__ = btBoxShape;

btBoxShape.__cache__ = {};

Module["btBoxShape"] = btBoxShape;

btBoxShape.prototype["setMargin"] = btBoxShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btBoxShape_setMargin_1(self, margin);
};

btBoxShape.prototype["getMargin"] = btBoxShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btBoxShape_getMargin_0(self);
};

btBoxShape.prototype["setLocalScaling"] = btBoxShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btBoxShape_setLocalScaling_1(self, scaling);
};

btBoxShape.prototype["getLocalScaling"] = btBoxShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btBoxShape_getLocalScaling_0(self), btVector3);
};

btBoxShape.prototype["calculateLocalInertia"] = btBoxShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btBoxShape_calculateLocalInertia_2(self, mass, inertia);
};

btBoxShape.prototype["__destroy__"] = btBoxShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBoxShape___destroy___0(self);
};

function btCapsuleShape(radius, height) {
 if (radius && typeof radius === "object") radius = radius.ptr;
 if (height && typeof height === "object") height = height.ptr;
 this.ptr = _emscripten_bind_btCapsuleShape_btCapsuleShape_2(radius, height);
 getCache(btCapsuleShape)[this.ptr] = this;
}

btCapsuleShape.prototype = Object.create(btCollisionShape.prototype);

btCapsuleShape.prototype.constructor = btCapsuleShape;

btCapsuleShape.prototype.__class__ = btCapsuleShape;

btCapsuleShape.__cache__ = {};

Module["btCapsuleShape"] = btCapsuleShape;

btCapsuleShape.prototype["setMargin"] = btCapsuleShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btCapsuleShape_setMargin_1(self, margin);
};

btCapsuleShape.prototype["getMargin"] = btCapsuleShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getMargin_0(self);
};

btCapsuleShape.prototype["getUpAxis"] = btCapsuleShape.prototype.getUpAxis = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getUpAxis_0(self);
};

btCapsuleShape.prototype["getRadius"] = btCapsuleShape.prototype.getRadius = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getRadius_0(self);
};

btCapsuleShape.prototype["getHalfHeight"] = btCapsuleShape.prototype.getHalfHeight = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getHalfHeight_0(self);
};

btCapsuleShape.prototype["setLocalScaling"] = btCapsuleShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btCapsuleShape_setLocalScaling_1(self, scaling);
};

btCapsuleShape.prototype["getLocalScaling"] = btCapsuleShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCapsuleShape_getLocalScaling_0(self), btVector3);
};

btCapsuleShape.prototype["calculateLocalInertia"] = btCapsuleShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btCapsuleShape_calculateLocalInertia_2(self, mass, inertia);
};

btCapsuleShape.prototype["__destroy__"] = btCapsuleShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCapsuleShape___destroy___0(self);
};

function btConvexHullShape(points, numPoints) {
 ensureCache.prepare();
 if (typeof points == "object") {
  points = ensureFloat32(points);
 }
 if (numPoints && typeof numPoints === "object") numPoints = numPoints.ptr;
 if (points === undefined) {
  this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_0();
  getCache(btConvexHullShape)[this.ptr] = this;
  return;
 }
 if (numPoints === undefined) {
  this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_1(points);
  getCache(btConvexHullShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_2(points, numPoints);
 getCache(btConvexHullShape)[this.ptr] = this;
}

btConvexHullShape.prototype = Object.create(btCollisionShape.prototype);

btConvexHullShape.prototype.constructor = btConvexHullShape;

btConvexHullShape.prototype.__class__ = btConvexHullShape;

btConvexHullShape.__cache__ = {};

Module["btConvexHullShape"] = btConvexHullShape;

btConvexHullShape.prototype["addPoint"] = btConvexHullShape.prototype.addPoint = function(point, recalculateLocalAABB) {
 var self = this.ptr;
 if (point && typeof point === "object") point = point.ptr;
 if (recalculateLocalAABB && typeof recalculateLocalAABB === "object") recalculateLocalAABB = recalculateLocalAABB.ptr;
 if (recalculateLocalAABB === undefined) {
  _emscripten_bind_btConvexHullShape_addPoint_1(self, point);
  return;
 }
 _emscripten_bind_btConvexHullShape_addPoint_2(self, point, recalculateLocalAABB);
};

btConvexHullShape.prototype["setMargin"] = btConvexHullShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btConvexHullShape_setMargin_1(self, margin);
};

btConvexHullShape.prototype["setLocalScaling"] = btConvexHullShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConvexHullShape_setLocalScaling_1(self, scaling);
};

btConvexHullShape.prototype["getLocalScaling"] = btConvexHullShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexHullShape_getLocalScaling_0(self), btVector3);
};

btConvexHullShape.prototype["calculateLocalInertia"] = btConvexHullShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btConvexHullShape_calculateLocalInertia_2(self, mass, inertia);
};

btConvexHullShape.prototype["__destroy__"] = btConvexHullShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexHullShape___destroy___0(self);
};

function btCompoundShape(enableDynamicAabbTree) {
 if (enableDynamicAabbTree && typeof enableDynamicAabbTree === "object") enableDynamicAabbTree = enableDynamicAabbTree.ptr;
 if (enableDynamicAabbTree === undefined) {
  this.ptr = _emscripten_bind_btCompoundShape_btCompoundShape_0();
  getCache(btCompoundShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btCompoundShape_btCompoundShape_1(enableDynamicAabbTree);
 getCache(btCompoundShape)[this.ptr] = this;
}

btCompoundShape.prototype = Object.create(btCollisionShape.prototype);

btCompoundShape.prototype.constructor = btCompoundShape;

btCompoundShape.prototype.__class__ = btCompoundShape;

btCompoundShape.__cache__ = {};

Module["btCompoundShape"] = btCompoundShape;

btCompoundShape.prototype["addChildShape"] = btCompoundShape.prototype.addChildShape = function(localTransform, shape) {
 var self = this.ptr;
 if (localTransform && typeof localTransform === "object") localTransform = localTransform.ptr;
 if (shape && typeof shape === "object") shape = shape.ptr;
 _emscripten_bind_btCompoundShape_addChildShape_2(self, localTransform, shape);
};

btCompoundShape.prototype["setMargin"] = btCompoundShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btCompoundShape_setMargin_1(self, margin);
};

btCompoundShape.prototype["getMargin"] = btCompoundShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCompoundShape_getMargin_0(self);
};

btCompoundShape.prototype["setLocalScaling"] = btCompoundShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btCompoundShape_setLocalScaling_1(self, scaling);
};

btCompoundShape.prototype["getLocalScaling"] = btCompoundShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCompoundShape_getLocalScaling_0(self), btVector3);
};

btCompoundShape.prototype["calculateLocalInertia"] = btCompoundShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btCompoundShape_calculateLocalInertia_2(self, mass, inertia);
};

btCompoundShape.prototype["__destroy__"] = btCompoundShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCompoundShape___destroy___0(self);
};

function btIndexedMesh() {
 throw "cannot construct a btIndexedMesh, no constructor in IDL";
}

btIndexedMesh.prototype = Object.create(WrapperObject.prototype);

btIndexedMesh.prototype.constructor = btIndexedMesh;

btIndexedMesh.prototype.__class__ = btIndexedMesh;

btIndexedMesh.__cache__ = {};

Module["btIndexedMesh"] = btIndexedMesh;

btIndexedMesh.prototype["get_m_numTriangles"] = btIndexedMesh.prototype.get_m_numTriangles = function() {
 var self = this.ptr;
 return _emscripten_bind_btIndexedMesh_get_m_numTriangles_0(self);
};

btIndexedMesh.prototype["set_m_numTriangles"] = btIndexedMesh.prototype.set_m_numTriangles = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btIndexedMesh_set_m_numTriangles_1(self, arg0);
};

Object.defineProperty(btIndexedMesh.prototype, "m_numTriangles", {
 get: btIndexedMesh.prototype.get_m_numTriangles,
 set: btIndexedMesh.prototype.set_m_numTriangles
});

btIndexedMesh.prototype["__destroy__"] = btIndexedMesh.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btIndexedMesh___destroy___0(self);
};

function btIndexedMeshArray() {
 throw "cannot construct a btIndexedMeshArray, no constructor in IDL";
}

btIndexedMeshArray.prototype = Object.create(WrapperObject.prototype);

btIndexedMeshArray.prototype.constructor = btIndexedMeshArray;

btIndexedMeshArray.prototype.__class__ = btIndexedMeshArray;

btIndexedMeshArray.__cache__ = {};

Module["btIndexedMeshArray"] = btIndexedMeshArray;

btIndexedMeshArray.prototype["size"] = btIndexedMeshArray.prototype.size = function() {
 var self = this.ptr;
 return _emscripten_bind_btIndexedMeshArray_size_0(self);
};

btIndexedMeshArray.prototype["at"] = btIndexedMeshArray.prototype.at = function(n) {
 var self = this.ptr;
 if (n && typeof n === "object") n = n.ptr;
 return wrapPointer(_emscripten_bind_btIndexedMeshArray_at_1(self, n), btIndexedMesh);
};

btIndexedMeshArray.prototype["__destroy__"] = btIndexedMeshArray.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btIndexedMeshArray___destroy___0(self);
};

function btTriangleMesh(use32bitIndices, use4componentVertices) {
 if (use32bitIndices && typeof use32bitIndices === "object") use32bitIndices = use32bitIndices.ptr;
 if (use4componentVertices && typeof use4componentVertices === "object") use4componentVertices = use4componentVertices.ptr;
 if (use32bitIndices === undefined) {
  this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_0();
  getCache(btTriangleMesh)[this.ptr] = this;
  return;
 }
 if (use4componentVertices === undefined) {
  this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_1(use32bitIndices);
  getCache(btTriangleMesh)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_2(use32bitIndices, use4componentVertices);
 getCache(btTriangleMesh)[this.ptr] = this;
}

btTriangleMesh.prototype = Object.create(btStridingMeshInterface.prototype);

btTriangleMesh.prototype.constructor = btTriangleMesh;

btTriangleMesh.prototype.__class__ = btTriangleMesh;

btTriangleMesh.__cache__ = {};

Module["btTriangleMesh"] = btTriangleMesh;

btTriangleMesh.prototype["addTriangle"] = btTriangleMesh.prototype.addTriangle = function(vertex0, vertex1, vertex2, removeDuplicateVertices) {
 var self = this.ptr;
 if (vertex0 && typeof vertex0 === "object") vertex0 = vertex0.ptr;
 if (vertex1 && typeof vertex1 === "object") vertex1 = vertex1.ptr;
 if (vertex2 && typeof vertex2 === "object") vertex2 = vertex2.ptr;
 if (removeDuplicateVertices && typeof removeDuplicateVertices === "object") removeDuplicateVertices = removeDuplicateVertices.ptr;
 if (removeDuplicateVertices === undefined) {
  _emscripten_bind_btTriangleMesh_addTriangle_3(self, vertex0, vertex1, vertex2);
  return;
 }
 _emscripten_bind_btTriangleMesh_addTriangle_4(self, vertex0, vertex1, vertex2, removeDuplicateVertices);
};

btTriangleMesh.prototype["findOrAddVertex"] = btTriangleMesh.prototype.findOrAddVertex = function(vertex, removeDuplicateVertices) {
 var self = this.ptr;
 if (vertex && typeof vertex === "object") vertex = vertex.ptr;
 if (removeDuplicateVertices && typeof removeDuplicateVertices === "object") removeDuplicateVertices = removeDuplicateVertices.ptr;
 return _emscripten_bind_btTriangleMesh_findOrAddVertex_2(self, vertex, removeDuplicateVertices);
};

btTriangleMesh.prototype["addIndex"] = btTriangleMesh.prototype.addIndex = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 _emscripten_bind_btTriangleMesh_addIndex_1(self, index);
};

btTriangleMesh.prototype["preallocateIndices"] = btTriangleMesh.prototype.preallocateIndices = function(numindices) {
 var self = this.ptr;
 if (numindices && typeof numindices === "object") numindices = numindices.ptr;
 _emscripten_bind_btTriangleMesh_preallocateIndices_1(self, numindices);
};

btTriangleMesh.prototype["preallocateVertices"] = btTriangleMesh.prototype.preallocateVertices = function(numverts) {
 var self = this.ptr;
 if (numverts && typeof numverts === "object") numverts = numverts.ptr;
 _emscripten_bind_btTriangleMesh_preallocateVertices_1(self, numverts);
};

btTriangleMesh.prototype["getIndexedMeshArray"] = btTriangleMesh.prototype.getIndexedMeshArray = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTriangleMesh_getIndexedMeshArray_0(self), btIndexedMeshArray);
};

btTriangleMesh.prototype["setScaling"] = btTriangleMesh.prototype.setScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btTriangleMesh_setScaling_1(self, scaling);
};

btTriangleMesh.prototype["__destroy__"] = btTriangleMesh.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleMesh___destroy___0(self);
};

function btEmptyShape() {
 this.ptr = _emscripten_bind_btEmptyShape_btEmptyShape_0();
 getCache(btEmptyShape)[this.ptr] = this;
}

btEmptyShape.prototype = Object.create(btConcaveShape.prototype);

btEmptyShape.prototype.constructor = btEmptyShape;

btEmptyShape.prototype.__class__ = btEmptyShape;

btEmptyShape.__cache__ = {};

Module["btEmptyShape"] = btEmptyShape;

btEmptyShape.prototype["setLocalScaling"] = btEmptyShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btEmptyShape_setLocalScaling_1(self, scaling);
};

btEmptyShape.prototype["getLocalScaling"] = btEmptyShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btEmptyShape_getLocalScaling_0(self), btVector3);
};

btEmptyShape.prototype["calculateLocalInertia"] = btEmptyShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btEmptyShape_calculateLocalInertia_2(self, mass, inertia);
};

btEmptyShape.prototype["__destroy__"] = btEmptyShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btEmptyShape___destroy___0(self);
};

function btBvhTriangleMeshShape(meshInterface, useQuantizedAabbCompression, buildBvh) {
 if (meshInterface && typeof meshInterface === "object") meshInterface = meshInterface.ptr;
 if (useQuantizedAabbCompression && typeof useQuantizedAabbCompression === "object") useQuantizedAabbCompression = useQuantizedAabbCompression.ptr;
 if (buildBvh && typeof buildBvh === "object") buildBvh = buildBvh.ptr;
 if (buildBvh === undefined) {
  this.ptr = _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2(meshInterface, useQuantizedAabbCompression);
  getCache(btBvhTriangleMeshShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3(meshInterface, useQuantizedAabbCompression, buildBvh);
 getCache(btBvhTriangleMeshShape)[this.ptr] = this;
}

btBvhTriangleMeshShape.prototype = Object.create(btTriangleMeshShape.prototype);

btBvhTriangleMeshShape.prototype.constructor = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype.__class__ = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.__cache__ = {};

Module["btBvhTriangleMeshShape"] = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype["setLocalScaling"] = btBvhTriangleMeshShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1(self, scaling);
};

btBvhTriangleMeshShape.prototype["getLocalScaling"] = btBvhTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btBvhTriangleMeshShape.prototype["calculateLocalInertia"] = btBvhTriangleMeshShape.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2(self, mass, inertia);
};

btBvhTriangleMeshShape.prototype["__destroy__"] = btBvhTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBvhTriangleMeshShape___destroy___0(self);
};

function btAABB(V1, V2, V3, margin) {
 if (V1 && typeof V1 === "object") V1 = V1.ptr;
 if (V2 && typeof V2 === "object") V2 = V2.ptr;
 if (V3 && typeof V3 === "object") V3 = V3.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 this.ptr = _emscripten_bind_btAABB_btAABB_4(V1, V2, V3, margin);
 getCache(btAABB)[this.ptr] = this;
}

btAABB.prototype = Object.create(WrapperObject.prototype);

btAABB.prototype.constructor = btAABB;

btAABB.prototype.__class__ = btAABB;

btAABB.__cache__ = {};

Module["btAABB"] = btAABB;

btAABB.prototype["invalidate"] = btAABB.prototype.invalidate = function() {
 var self = this.ptr;
 _emscripten_bind_btAABB_invalidate_0(self);
};

btAABB.prototype["increment_margin"] = btAABB.prototype.increment_margin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btAABB_increment_margin_1(self, margin);
};

btAABB.prototype["copy_with_margin"] = btAABB.prototype.copy_with_margin = function(other, margin) {
 var self = this.ptr;
 if (other && typeof other === "object") other = other.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btAABB_copy_with_margin_2(self, other, margin);
};

btAABB.prototype["__destroy__"] = btAABB.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btAABB___destroy___0(self);
};

function btPrimitiveTriangle() {
 throw "cannot construct a btPrimitiveTriangle, no constructor in IDL";
}

btPrimitiveTriangle.prototype = Object.create(WrapperObject.prototype);

btPrimitiveTriangle.prototype.constructor = btPrimitiveTriangle;

btPrimitiveTriangle.prototype.__class__ = btPrimitiveTriangle;

btPrimitiveTriangle.__cache__ = {};

Module["btPrimitiveTriangle"] = btPrimitiveTriangle;

btPrimitiveTriangle.prototype["__destroy__"] = btPrimitiveTriangle.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPrimitiveTriangle___destroy___0(self);
};

function btTriangleShapeEx(p1, p2, p3) {
 if (p1 && typeof p1 === "object") p1 = p1.ptr;
 if (p2 && typeof p2 === "object") p2 = p2.ptr;
 if (p3 && typeof p3 === "object") p3 = p3.ptr;
 this.ptr = _emscripten_bind_btTriangleShapeEx_btTriangleShapeEx_3(p1, p2, p3);
 getCache(btTriangleShapeEx)[this.ptr] = this;
}

btTriangleShapeEx.prototype = Object.create(WrapperObject.prototype);

btTriangleShapeEx.prototype.constructor = btTriangleShapeEx;

btTriangleShapeEx.prototype.__class__ = btTriangleShapeEx;

btTriangleShapeEx.__cache__ = {};

Module["btTriangleShapeEx"] = btTriangleShapeEx;

btTriangleShapeEx.prototype["getAabb"] = btTriangleShapeEx.prototype.getAabb = function(t, aabbMin, aabbMax) {
 var self = this.ptr;
 if (t && typeof t === "object") t = t.ptr;
 if (aabbMin && typeof aabbMin === "object") aabbMin = aabbMin.ptr;
 if (aabbMax && typeof aabbMax === "object") aabbMax = aabbMax.ptr;
 _emscripten_bind_btTriangleShapeEx_getAabb_3(self, t, aabbMin, aabbMax);
};

btTriangleShapeEx.prototype["applyTransform"] = btTriangleShapeEx.prototype.applyTransform = function(t) {
 var self = this.ptr;
 if (t && typeof t === "object") t = t.ptr;
 _emscripten_bind_btTriangleShapeEx_applyTransform_1(self, t);
};

btTriangleShapeEx.prototype["__destroy__"] = btTriangleShapeEx.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleShapeEx___destroy___0(self);
};

function btPrimitiveManagerBase() {
 throw "cannot construct a btPrimitiveManagerBase, no constructor in IDL";
}

btPrimitiveManagerBase.prototype = Object.create(WrapperObject.prototype);

btPrimitiveManagerBase.prototype.constructor = btPrimitiveManagerBase;

btPrimitiveManagerBase.prototype.__class__ = btPrimitiveManagerBase;

btPrimitiveManagerBase.__cache__ = {};

Module["btPrimitiveManagerBase"] = btPrimitiveManagerBase;

btPrimitiveManagerBase.prototype["is_trimesh"] = btPrimitiveManagerBase.prototype.is_trimesh = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPrimitiveManagerBase_is_trimesh_0(self);
};

btPrimitiveManagerBase.prototype["get_primitive_count"] = btPrimitiveManagerBase.prototype.get_primitive_count = function() {
 var self = this.ptr;
 return _emscripten_bind_btPrimitiveManagerBase_get_primitive_count_0(self);
};

btPrimitiveManagerBase.prototype["get_primitive_box"] = btPrimitiveManagerBase.prototype.get_primitive_box = function(prim_index, primbox) {
 var self = this.ptr;
 if (prim_index && typeof prim_index === "object") prim_index = prim_index.ptr;
 if (primbox && typeof primbox === "object") primbox = primbox.ptr;
 _emscripten_bind_btPrimitiveManagerBase_get_primitive_box_2(self, prim_index, primbox);
};

btPrimitiveManagerBase.prototype["get_primitive_triangle"] = btPrimitiveManagerBase.prototype.get_primitive_triangle = function(prim_index, triangle) {
 var self = this.ptr;
 if (prim_index && typeof prim_index === "object") prim_index = prim_index.ptr;
 if (triangle && typeof triangle === "object") triangle = triangle.ptr;
 _emscripten_bind_btPrimitiveManagerBase_get_primitive_triangle_2(self, prim_index, triangle);
};

btPrimitiveManagerBase.prototype["__destroy__"] = btPrimitiveManagerBase.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPrimitiveManagerBase___destroy___0(self);
};

function btTetrahedronShapeEx() {
 this.ptr = _emscripten_bind_btTetrahedronShapeEx_btTetrahedronShapeEx_0();
 getCache(btTetrahedronShapeEx)[this.ptr] = this;
}

btTetrahedronShapeEx.prototype = Object.create(WrapperObject.prototype);

btTetrahedronShapeEx.prototype.constructor = btTetrahedronShapeEx;

btTetrahedronShapeEx.prototype.__class__ = btTetrahedronShapeEx;

btTetrahedronShapeEx.__cache__ = {};

Module["btTetrahedronShapeEx"] = btTetrahedronShapeEx;

btTetrahedronShapeEx.prototype["setVertices"] = btTetrahedronShapeEx.prototype.setVertices = function(v0, v1, v2, v3) {
 var self = this.ptr;
 if (v0 && typeof v0 === "object") v0 = v0.ptr;
 if (v1 && typeof v1 === "object") v1 = v1.ptr;
 if (v2 && typeof v2 === "object") v2 = v2.ptr;
 if (v3 && typeof v3 === "object") v3 = v3.ptr;
 _emscripten_bind_btTetrahedronShapeEx_setVertices_4(self, v0, v1, v2, v3);
};

btTetrahedronShapeEx.prototype["__destroy__"] = btTetrahedronShapeEx.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTetrahedronShapeEx___destroy___0(self);
};

function btGImpactShapeInterface() {
 throw "cannot construct a btGImpactShapeInterface, no constructor in IDL";
}

btGImpactShapeInterface.prototype = Object.create(btConcaveShape.prototype);

btGImpactShapeInterface.prototype.constructor = btGImpactShapeInterface;

btGImpactShapeInterface.prototype.__class__ = btGImpactShapeInterface;

btGImpactShapeInterface.__cache__ = {};

Module["btGImpactShapeInterface"] = btGImpactShapeInterface;

btGImpactShapeInterface.prototype["updateBound"] = btGImpactShapeInterface.prototype.updateBound = function() {
 var self = this.ptr;
 _emscripten_bind_btGImpactShapeInterface_updateBound_0(self);
};

btGImpactShapeInterface.prototype["postUpdate"] = btGImpactShapeInterface.prototype.postUpdate = function() {
 var self = this.ptr;
 _emscripten_bind_btGImpactShapeInterface_postUpdate_0(self);
};

btGImpactShapeInterface.prototype["getShapeType"] = btGImpactShapeInterface.prototype.getShapeType = function() {
 var self = this.ptr;
 return _emscripten_bind_btGImpactShapeInterface_getShapeType_0(self);
};

btGImpactShapeInterface.prototype["getName"] = btGImpactShapeInterface.prototype.getName = function() {
 var self = this.ptr;
 return UTF8ToString(_emscripten_bind_btGImpactShapeInterface_getName_0(self));
};

btGImpactShapeInterface.prototype["getGImpactShapeType"] = btGImpactShapeInterface.prototype.getGImpactShapeType = function() {
 var self = this.ptr;
 return _emscripten_bind_btGImpactShapeInterface_getGImpactShapeType_0(self);
};

btGImpactShapeInterface.prototype["getPrimitiveManager"] = btGImpactShapeInterface.prototype.getPrimitiveManager = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGImpactShapeInterface_getPrimitiveManager_0(self), btPrimitiveManagerBase);
};

btGImpactShapeInterface.prototype["getNumChildShapes"] = btGImpactShapeInterface.prototype.getNumChildShapes = function() {
 var self = this.ptr;
 return _emscripten_bind_btGImpactShapeInterface_getNumChildShapes_0(self);
};

btGImpactShapeInterface.prototype["childrenHasTransform"] = btGImpactShapeInterface.prototype.childrenHasTransform = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGImpactShapeInterface_childrenHasTransform_0(self);
};

btGImpactShapeInterface.prototype["needsRetrieveTriangles"] = btGImpactShapeInterface.prototype.needsRetrieveTriangles = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGImpactShapeInterface_needsRetrieveTriangles_0(self);
};

btGImpactShapeInterface.prototype["needsRetrieveTetrahedrons"] = btGImpactShapeInterface.prototype.needsRetrieveTetrahedrons = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGImpactShapeInterface_needsRetrieveTetrahedrons_0(self);
};

btGImpactShapeInterface.prototype["getBulletTriangle"] = btGImpactShapeInterface.prototype.getBulletTriangle = function(prim_index, triangle) {
 var self = this.ptr;
 if (prim_index && typeof prim_index === "object") prim_index = prim_index.ptr;
 if (triangle && typeof triangle === "object") triangle = triangle.ptr;
 _emscripten_bind_btGImpactShapeInterface_getBulletTriangle_2(self, prim_index, triangle);
};

btGImpactShapeInterface.prototype["getBulletTetrahedron"] = btGImpactShapeInterface.prototype.getBulletTetrahedron = function(prim_index, tetrahedron) {
 var self = this.ptr;
 if (prim_index && typeof prim_index === "object") prim_index = prim_index.ptr;
 if (tetrahedron && typeof tetrahedron === "object") tetrahedron = tetrahedron.ptr;
 _emscripten_bind_btGImpactShapeInterface_getBulletTetrahedron_2(self, prim_index, tetrahedron);
};

btGImpactShapeInterface.prototype["getChildShape"] = btGImpactShapeInterface.prototype.getChildShape = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 return wrapPointer(_emscripten_bind_btGImpactShapeInterface_getChildShape_1(self, index), btCollisionShape);
};

btGImpactShapeInterface.prototype["getChildTransform"] = btGImpactShapeInterface.prototype.getChildTransform = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 return wrapPointer(_emscripten_bind_btGImpactShapeInterface_getChildTransform_1(self, index), btTransform);
};

btGImpactShapeInterface.prototype["setChildTransform"] = btGImpactShapeInterface.prototype.setChildTransform = function(index, transform) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 if (transform && typeof transform === "object") transform = transform.ptr;
 _emscripten_bind_btGImpactShapeInterface_setChildTransform_2(self, index, transform);
};

btGImpactShapeInterface.prototype["setLocalScaling"] = btGImpactShapeInterface.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btGImpactShapeInterface_setLocalScaling_1(self, scaling);
};

btGImpactShapeInterface.prototype["getLocalScaling"] = btGImpactShapeInterface.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGImpactShapeInterface_getLocalScaling_0(self), btVector3);
};

btGImpactShapeInterface.prototype["calculateLocalInertia"] = btGImpactShapeInterface.prototype.calculateLocalInertia = function(mass, inertia) {
 var self = this.ptr;
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (inertia && typeof inertia === "object") inertia = inertia.ptr;
 _emscripten_bind_btGImpactShapeInterface_calculateLocalInertia_2(self, mass, inertia);
};

btGImpactShapeInterface.prototype["__destroy__"] = btGImpactShapeInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGImpactShapeInterface___destroy___0(self);
};

function btCollisionAlgorithmConstructionInfo(dispatcher, temp) {
 if (dispatcher && typeof dispatcher === "object") dispatcher = dispatcher.ptr;
 if (temp && typeof temp === "object") temp = temp.ptr;
 if (dispatcher === undefined) {
  this.ptr = _emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_0();
  getCache(btCollisionAlgorithmConstructionInfo)[this.ptr] = this;
  return;
 }
 if (temp === undefined) {
  this.ptr = _emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_1(dispatcher);
  getCache(btCollisionAlgorithmConstructionInfo)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btCollisionAlgorithmConstructionInfo_btCollisionAlgorithmConstructionInfo_2(dispatcher, temp);
 getCache(btCollisionAlgorithmConstructionInfo)[this.ptr] = this;
}

btCollisionAlgorithmConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btCollisionAlgorithmConstructionInfo.prototype.constructor = btCollisionAlgorithmConstructionInfo;

btCollisionAlgorithmConstructionInfo.prototype.__class__ = btCollisionAlgorithmConstructionInfo;

btCollisionAlgorithmConstructionInfo.__cache__ = {};

Module["btCollisionAlgorithmConstructionInfo"] = btCollisionAlgorithmConstructionInfo;

btCollisionAlgorithmConstructionInfo.prototype["get_m_dispatcher1"] = btCollisionAlgorithmConstructionInfo.prototype.get_m_dispatcher1 = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionAlgorithmConstructionInfo_get_m_dispatcher1_0(self), btDispatcher);
};

btCollisionAlgorithmConstructionInfo.prototype["set_m_dispatcher1"] = btCollisionAlgorithmConstructionInfo.prototype.set_m_dispatcher1 = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionAlgorithmConstructionInfo_set_m_dispatcher1_1(self, arg0);
};

Object.defineProperty(btCollisionAlgorithmConstructionInfo.prototype, "m_dispatcher1", {
 get: btCollisionAlgorithmConstructionInfo.prototype.get_m_dispatcher1,
 set: btCollisionAlgorithmConstructionInfo.prototype.set_m_dispatcher1
});

btCollisionAlgorithmConstructionInfo.prototype["__destroy__"] = btCollisionAlgorithmConstructionInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionAlgorithmConstructionInfo___destroy___0(self);
};

function btGImpactCollisionAlgorithm(ci, body0Wrap, body1Wrap) {
 if (ci && typeof ci === "object") ci = ci.ptr;
 if (body0Wrap && typeof body0Wrap === "object") body0Wrap = body0Wrap.ptr;
 if (body1Wrap && typeof body1Wrap === "object") body1Wrap = body1Wrap.ptr;
 this.ptr = _emscripten_bind_btGImpactCollisionAlgorithm_btGImpactCollisionAlgorithm_3(ci, body0Wrap, body1Wrap);
 getCache(btGImpactCollisionAlgorithm)[this.ptr] = this;
}

btGImpactCollisionAlgorithm.prototype = Object.create(btActivatingCollisionAlgorithm.prototype);

btGImpactCollisionAlgorithm.prototype.constructor = btGImpactCollisionAlgorithm;

btGImpactCollisionAlgorithm.prototype.__class__ = btGImpactCollisionAlgorithm;

btGImpactCollisionAlgorithm.__cache__ = {};

Module["btGImpactCollisionAlgorithm"] = btGImpactCollisionAlgorithm;

btGImpactCollisionAlgorithm.prototype["registerAlgorithm"] = btGImpactCollisionAlgorithm.prototype.registerAlgorithm = function(dispatcher) {
 var self = this.ptr;
 if (dispatcher && typeof dispatcher === "object") dispatcher = dispatcher.ptr;
 _emscripten_bind_btGImpactCollisionAlgorithm_registerAlgorithm_1(self, dispatcher);
};

btGImpactCollisionAlgorithm.prototype["__destroy__"] = btGImpactCollisionAlgorithm.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGImpactCollisionAlgorithm___destroy___0(self);
};

function btDefaultCollisionConstructionInfo() {
 this.ptr = _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0();
 getCache(btDefaultCollisionConstructionInfo)[this.ptr] = this;
}

btDefaultCollisionConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btDefaultCollisionConstructionInfo.prototype.constructor = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype.__class__ = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.__cache__ = {};

Module["btDefaultCollisionConstructionInfo"] = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype["__destroy__"] = btDefaultCollisionConstructionInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0(self);
};

function btDefaultCollisionConfiguration(info) {
 if (info && typeof info === "object") info = info.ptr;
 if (info === undefined) {
  this.ptr = _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0();
  getCache(btDefaultCollisionConfiguration)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1(info);
 getCache(btDefaultCollisionConfiguration)[this.ptr] = this;
}

btDefaultCollisionConfiguration.prototype = Object.create(WrapperObject.prototype);

btDefaultCollisionConfiguration.prototype.constructor = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.prototype.__class__ = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.__cache__ = {};

Module["btDefaultCollisionConfiguration"] = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.prototype["__destroy__"] = btDefaultCollisionConfiguration.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultCollisionConfiguration___destroy___0(self);
};

function btCollisionDispatcher(conf) {
 if (conf && typeof conf === "object") conf = conf.ptr;
 this.ptr = _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1(conf);
 getCache(btCollisionDispatcher)[this.ptr] = this;
}

btCollisionDispatcher.prototype = Object.create(btDispatcher.prototype);

btCollisionDispatcher.prototype.constructor = btCollisionDispatcher;

btCollisionDispatcher.prototype.__class__ = btCollisionDispatcher;

btCollisionDispatcher.__cache__ = {};

Module["btCollisionDispatcher"] = btCollisionDispatcher;

btCollisionDispatcher.prototype["getNumManifolds"] = btCollisionDispatcher.prototype.getNumManifolds = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionDispatcher_getNumManifolds_0(self);
};

btCollisionDispatcher.prototype["__destroy__"] = btCollisionDispatcher.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionDispatcher___destroy___0(self);
};

function btOverlappingPairCallback() {
 throw "cannot construct a btOverlappingPairCallback, no constructor in IDL";
}

btOverlappingPairCallback.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCallback.prototype.constructor = btOverlappingPairCallback;

btOverlappingPairCallback.prototype.__class__ = btOverlappingPairCallback;

btOverlappingPairCallback.__cache__ = {};

Module["btOverlappingPairCallback"] = btOverlappingPairCallback;

btOverlappingPairCallback.prototype["__destroy__"] = btOverlappingPairCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btOverlappingPairCallback___destroy___0(self);
};

function btOverlappingPairCache() {
 throw "cannot construct a btOverlappingPairCache, no constructor in IDL";
}

btOverlappingPairCache.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCache.prototype.constructor = btOverlappingPairCache;

btOverlappingPairCache.prototype.__class__ = btOverlappingPairCache;

btOverlappingPairCache.__cache__ = {};

Module["btOverlappingPairCache"] = btOverlappingPairCache;

btOverlappingPairCache.prototype["setInternalGhostPairCallback"] = btOverlappingPairCache.prototype.setInternalGhostPairCallback = function(ghostPairCallback) {
 var self = this.ptr;
 if (ghostPairCallback && typeof ghostPairCallback === "object") ghostPairCallback = ghostPairCallback.ptr;
 _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1(self, ghostPairCallback);
};

btOverlappingPairCache.prototype["getNumOverlappingPairs"] = btOverlappingPairCache.prototype.getNumOverlappingPairs = function() {
 var self = this.ptr;
 return _emscripten_bind_btOverlappingPairCache_getNumOverlappingPairs_0(self);
};

btOverlappingPairCache.prototype["__destroy__"] = btOverlappingPairCache.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btOverlappingPairCache___destroy___0(self);
};

function btBroadphaseInterface() {
 throw "cannot construct a btBroadphaseInterface, no constructor in IDL";
}

btBroadphaseInterface.prototype = Object.create(WrapperObject.prototype);

btBroadphaseInterface.prototype.constructor = btBroadphaseInterface;

btBroadphaseInterface.prototype.__class__ = btBroadphaseInterface;

btBroadphaseInterface.__cache__ = {};

Module["btBroadphaseInterface"] = btBroadphaseInterface;

btBroadphaseInterface.prototype["getOverlappingPairCache"] = btBroadphaseInterface.prototype.getOverlappingPairCache = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0(self), btOverlappingPairCache);
};

btBroadphaseInterface.prototype["__destroy__"] = btBroadphaseInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBroadphaseInterface___destroy___0(self);
};

function btCollisionConfiguration() {
 throw "cannot construct a btCollisionConfiguration, no constructor in IDL";
}

btCollisionConfiguration.prototype = Object.create(WrapperObject.prototype);

btCollisionConfiguration.prototype.constructor = btCollisionConfiguration;

btCollisionConfiguration.prototype.__class__ = btCollisionConfiguration;

btCollisionConfiguration.__cache__ = {};

Module["btCollisionConfiguration"] = btCollisionConfiguration;

btCollisionConfiguration.prototype["__destroy__"] = btCollisionConfiguration.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionConfiguration___destroy___0(self);
};

function btDbvtBroadphase() {
 this.ptr = _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0();
 getCache(btDbvtBroadphase)[this.ptr] = this;
}

btDbvtBroadphase.prototype = Object.create(WrapperObject.prototype);

btDbvtBroadphase.prototype.constructor = btDbvtBroadphase;

btDbvtBroadphase.prototype.__class__ = btDbvtBroadphase;

btDbvtBroadphase.__cache__ = {};

Module["btDbvtBroadphase"] = btDbvtBroadphase;

btDbvtBroadphase.prototype["optimize"] = btDbvtBroadphase.prototype.optimize = function() {
 var self = this.ptr;
 _emscripten_bind_btDbvtBroadphase_optimize_0(self);
};

btDbvtBroadphase.prototype["__destroy__"] = btDbvtBroadphase.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDbvtBroadphase___destroy___0(self);
};

function btBroadphaseProxy() {
 throw "cannot construct a btBroadphaseProxy, no constructor in IDL";
}

btBroadphaseProxy.prototype = Object.create(WrapperObject.prototype);

btBroadphaseProxy.prototype.constructor = btBroadphaseProxy;

btBroadphaseProxy.prototype.__class__ = btBroadphaseProxy;

btBroadphaseProxy.__cache__ = {};

Module["btBroadphaseProxy"] = btBroadphaseProxy;

btBroadphaseProxy.prototype["get_m_collisionFilterGroup"] = btBroadphaseProxy.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0(self);
};

btBroadphaseProxy.prototype["set_m_collisionFilterGroup"] = btBroadphaseProxy.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(btBroadphaseProxy.prototype, "m_collisionFilterGroup", {
 get: btBroadphaseProxy.prototype.get_m_collisionFilterGroup,
 set: btBroadphaseProxy.prototype.set_m_collisionFilterGroup
});

btBroadphaseProxy.prototype["get_m_collisionFilterMask"] = btBroadphaseProxy.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0(self);
};

btBroadphaseProxy.prototype["set_m_collisionFilterMask"] = btBroadphaseProxy.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(btBroadphaseProxy.prototype, "m_collisionFilterMask", {
 get: btBroadphaseProxy.prototype.get_m_collisionFilterMask,
 set: btBroadphaseProxy.prototype.set_m_collisionFilterMask
});

btBroadphaseProxy.prototype["__destroy__"] = btBroadphaseProxy.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBroadphaseProxy___destroy___0(self);
};

function btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia) {
 if (mass && typeof mass === "object") mass = mass.ptr;
 if (motionState && typeof motionState === "object") motionState = motionState.ptr;
 if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
 if (localInertia && typeof localInertia === "object") localInertia = localInertia.ptr;
 if (localInertia === undefined) {
  this.ptr = _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3(mass, motionState, collisionShape);
  getCache(btRigidBodyConstructionInfo)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4(mass, motionState, collisionShape, localInertia);
 getCache(btRigidBodyConstructionInfo)[this.ptr] = this;
}

btRigidBodyConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btRigidBodyConstructionInfo.prototype.constructor = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.prototype.__class__ = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.__cache__ = {};

Module["btRigidBodyConstructionInfo"] = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.prototype["get_m_linearDamping"] = btRigidBodyConstructionInfo.prototype.get_m_linearDamping = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_linearDamping"] = btRigidBodyConstructionInfo.prototype.set_m_linearDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_linearDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_linearDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_linearDamping
});

btRigidBodyConstructionInfo.prototype["get_m_angularDamping"] = btRigidBodyConstructionInfo.prototype.get_m_angularDamping = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_angularDamping"] = btRigidBodyConstructionInfo.prototype.set_m_angularDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_angularDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_angularDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_angularDamping
});

btRigidBodyConstructionInfo.prototype["get_m_friction"] = btRigidBodyConstructionInfo.prototype.get_m_friction = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_friction"] = btRigidBodyConstructionInfo.prototype.set_m_friction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_friction", {
 get: btRigidBodyConstructionInfo.prototype.get_m_friction,
 set: btRigidBodyConstructionInfo.prototype.set_m_friction
});

btRigidBodyConstructionInfo.prototype["get_m_rollingFriction"] = btRigidBodyConstructionInfo.prototype.get_m_rollingFriction = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_rollingFriction"] = btRigidBodyConstructionInfo.prototype.set_m_rollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_rollingFriction", {
 get: btRigidBodyConstructionInfo.prototype.get_m_rollingFriction,
 set: btRigidBodyConstructionInfo.prototype.set_m_rollingFriction
});

btRigidBodyConstructionInfo.prototype["get_m_restitution"] = btRigidBodyConstructionInfo.prototype.get_m_restitution = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_restitution"] = btRigidBodyConstructionInfo.prototype.set_m_restitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_restitution", {
 get: btRigidBodyConstructionInfo.prototype.get_m_restitution,
 set: btRigidBodyConstructionInfo.prototype.set_m_restitution
});

btRigidBodyConstructionInfo.prototype["get_m_linearSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.get_m_linearSleepingThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_linearSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.set_m_linearSleepingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_linearSleepingThreshold", {
 get: btRigidBodyConstructionInfo.prototype.get_m_linearSleepingThreshold,
 set: btRigidBodyConstructionInfo.prototype.set_m_linearSleepingThreshold
});

btRigidBodyConstructionInfo.prototype["get_m_angularSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.get_m_angularSleepingThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_angularSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.set_m_angularSleepingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_angularSleepingThreshold", {
 get: btRigidBodyConstructionInfo.prototype.get_m_angularSleepingThreshold,
 set: btRigidBodyConstructionInfo.prototype.set_m_angularSleepingThreshold
});

btRigidBodyConstructionInfo.prototype["get_m_additionalDamping"] = btRigidBodyConstructionInfo.prototype.get_m_additionalDamping = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalDamping"] = btRigidBodyConstructionInfo.prototype.set_m_additionalDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalDamping
});

btRigidBodyConstructionInfo.prototype["get_m_additionalDampingFactor"] = btRigidBodyConstructionInfo.prototype.get_m_additionalDampingFactor = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalDampingFactor"] = btRigidBodyConstructionInfo.prototype.set_m_additionalDampingFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalDampingFactor", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalDampingFactor,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalDampingFactor
});

btRigidBodyConstructionInfo.prototype["get_m_additionalLinearDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.get_m_additionalLinearDampingThresholdSqr = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalLinearDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.set_m_additionalLinearDampingThresholdSqr = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalLinearDampingThresholdSqr", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalLinearDampingThresholdSqr,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalLinearDampingThresholdSqr
});

btRigidBodyConstructionInfo.prototype["get_m_additionalAngularDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingThresholdSqr = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalAngularDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingThresholdSqr = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalAngularDampingThresholdSqr", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingThresholdSqr,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingThresholdSqr
});

btRigidBodyConstructionInfo.prototype["get_m_additionalAngularDampingFactor"] = btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingFactor = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalAngularDampingFactor"] = btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalAngularDampingFactor", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingFactor,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingFactor
});

btRigidBodyConstructionInfo.prototype["__destroy__"] = btRigidBodyConstructionInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo___destroy___0(self);
};

function btRigidBody(constructionInfo) {
 if (constructionInfo && typeof constructionInfo === "object") constructionInfo = constructionInfo.ptr;
 this.ptr = _emscripten_bind_btRigidBody_btRigidBody_1(constructionInfo);
 getCache(btRigidBody)[this.ptr] = this;
}

btRigidBody.prototype = Object.create(btCollisionObject.prototype);

btRigidBody.prototype.constructor = btRigidBody;

btRigidBody.prototype.__class__ = btRigidBody;

btRigidBody.__cache__ = {};

Module["btRigidBody"] = btRigidBody;

btRigidBody.prototype["getCenterOfMassTransform"] = btRigidBody.prototype.getCenterOfMassTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getCenterOfMassTransform_0(self), btTransform);
};

btRigidBody.prototype["getCollisionShape"] = btRigidBody.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getCollisionShape_0(self), btCollisionShape);
};

btRigidBody.prototype["isStaticObject"] = btRigidBody.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isStaticObject_0(self);
};

btRigidBody.prototype["setFriction"] = btRigidBody.prototype.setFriction = function(frict) {
 var self = this.ptr;
 if (frict && typeof frict === "object") frict = frict.ptr;
 _emscripten_bind_btRigidBody_setFriction_1(self, frict);
};

btRigidBody.prototype["getWorldTransform"] = btRigidBody.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getWorldTransform_0(self), btTransform);
};

btRigidBody.prototype["setCollisionFlags"] = btRigidBody.prototype.setCollisionFlags = function(flags) {
 var self = this.ptr;
 if (flags && typeof flags === "object") flags = flags.ptr;
 _emscripten_bind_btRigidBody_setCollisionFlags_1(self, flags);
};

btRigidBody.prototype["setWorldTransform"] = btRigidBody.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btRigidBody_setWorldTransform_1(self, worldTrans);
};

btRigidBody.prototype["setCollisionShape"] = btRigidBody.prototype.setCollisionShape = function(collisionShape) {
 var self = this.ptr;
 if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
 _emscripten_bind_btRigidBody_setCollisionShape_1(self, collisionShape);
};

btRigidBody.prototype["__destroy__"] = btRigidBody.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBody___destroy___0(self);
};

function btSequentialImpulseConstraintSolver() {
 this.ptr = _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0();
 getCache(btSequentialImpulseConstraintSolver)[this.ptr] = this;
}

btSequentialImpulseConstraintSolver.prototype = Object.create(WrapperObject.prototype);

btSequentialImpulseConstraintSolver.prototype.constructor = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype.__class__ = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.__cache__ = {};

Module["btSequentialImpulseConstraintSolver"] = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype["__destroy__"] = btSequentialImpulseConstraintSolver.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0(self);
};

function btConstraintSolver() {
 throw "cannot construct a btConstraintSolver, no constructor in IDL";
}

btConstraintSolver.prototype = Object.create(WrapperObject.prototype);

btConstraintSolver.prototype.constructor = btConstraintSolver;

btConstraintSolver.prototype.__class__ = btConstraintSolver;

btConstraintSolver.__cache__ = {};

Module["btConstraintSolver"] = btConstraintSolver;

btConstraintSolver.prototype["__destroy__"] = btConstraintSolver.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConstraintSolver___destroy___0(self);
};

function btDispatcherInfo() {
 throw "cannot construct a btDispatcherInfo, no constructor in IDL";
}

btDispatcherInfo.prototype = Object.create(WrapperObject.prototype);

btDispatcherInfo.prototype.constructor = btDispatcherInfo;

btDispatcherInfo.prototype.__class__ = btDispatcherInfo;

btDispatcherInfo.__cache__ = {};

Module["btDispatcherInfo"] = btDispatcherInfo;

btDispatcherInfo.prototype["get_m_timeStep"] = btDispatcherInfo.prototype.get_m_timeStep = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_timeStep_0(self);
};

btDispatcherInfo.prototype["set_m_timeStep"] = btDispatcherInfo.prototype.set_m_timeStep = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_timeStep_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_timeStep", {
 get: btDispatcherInfo.prototype.get_m_timeStep,
 set: btDispatcherInfo.prototype.set_m_timeStep
});

btDispatcherInfo.prototype["get_m_stepCount"] = btDispatcherInfo.prototype.get_m_stepCount = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_stepCount_0(self);
};

btDispatcherInfo.prototype["set_m_stepCount"] = btDispatcherInfo.prototype.set_m_stepCount = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_stepCount_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_stepCount", {
 get: btDispatcherInfo.prototype.get_m_stepCount,
 set: btDispatcherInfo.prototype.set_m_stepCount
});

btDispatcherInfo.prototype["get_m_dispatchFunc"] = btDispatcherInfo.prototype.get_m_dispatchFunc = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0(self);
};

btDispatcherInfo.prototype["set_m_dispatchFunc"] = btDispatcherInfo.prototype.set_m_dispatchFunc = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_dispatchFunc", {
 get: btDispatcherInfo.prototype.get_m_dispatchFunc,
 set: btDispatcherInfo.prototype.set_m_dispatchFunc
});

btDispatcherInfo.prototype["get_m_timeOfImpact"] = btDispatcherInfo.prototype.get_m_timeOfImpact = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0(self);
};

btDispatcherInfo.prototype["set_m_timeOfImpact"] = btDispatcherInfo.prototype.set_m_timeOfImpact = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_timeOfImpact", {
 get: btDispatcherInfo.prototype.get_m_timeOfImpact,
 set: btDispatcherInfo.prototype.set_m_timeOfImpact
});

btDispatcherInfo.prototype["get_m_useContinuous"] = btDispatcherInfo.prototype.get_m_useContinuous = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0(self);
};

btDispatcherInfo.prototype["set_m_useContinuous"] = btDispatcherInfo.prototype.set_m_useContinuous = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useContinuous_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useContinuous", {
 get: btDispatcherInfo.prototype.get_m_useContinuous,
 set: btDispatcherInfo.prototype.set_m_useContinuous
});

btDispatcherInfo.prototype["get_m_enableSatConvex"] = btDispatcherInfo.prototype.get_m_enableSatConvex = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0(self);
};

btDispatcherInfo.prototype["set_m_enableSatConvex"] = btDispatcherInfo.prototype.set_m_enableSatConvex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_enableSatConvex", {
 get: btDispatcherInfo.prototype.get_m_enableSatConvex,
 set: btDispatcherInfo.prototype.set_m_enableSatConvex
});

btDispatcherInfo.prototype["get_m_enableSPU"] = btDispatcherInfo.prototype.get_m_enableSPU = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0(self);
};

btDispatcherInfo.prototype["set_m_enableSPU"] = btDispatcherInfo.prototype.set_m_enableSPU = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_enableSPU_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_enableSPU", {
 get: btDispatcherInfo.prototype.get_m_enableSPU,
 set: btDispatcherInfo.prototype.set_m_enableSPU
});

btDispatcherInfo.prototype["get_m_useEpa"] = btDispatcherInfo.prototype.get_m_useEpa = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useEpa_0(self);
};

btDispatcherInfo.prototype["set_m_useEpa"] = btDispatcherInfo.prototype.set_m_useEpa = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useEpa_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useEpa", {
 get: btDispatcherInfo.prototype.get_m_useEpa,
 set: btDispatcherInfo.prototype.set_m_useEpa
});

btDispatcherInfo.prototype["get_m_allowedCcdPenetration"] = btDispatcherInfo.prototype.get_m_allowedCcdPenetration = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0(self);
};

btDispatcherInfo.prototype["set_m_allowedCcdPenetration"] = btDispatcherInfo.prototype.set_m_allowedCcdPenetration = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_allowedCcdPenetration", {
 get: btDispatcherInfo.prototype.get_m_allowedCcdPenetration,
 set: btDispatcherInfo.prototype.set_m_allowedCcdPenetration
});

btDispatcherInfo.prototype["get_m_useConvexConservativeDistanceUtil"] = btDispatcherInfo.prototype.get_m_useConvexConservativeDistanceUtil = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0(self);
};

btDispatcherInfo.prototype["set_m_useConvexConservativeDistanceUtil"] = btDispatcherInfo.prototype.set_m_useConvexConservativeDistanceUtil = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useConvexConservativeDistanceUtil", {
 get: btDispatcherInfo.prototype.get_m_useConvexConservativeDistanceUtil,
 set: btDispatcherInfo.prototype.set_m_useConvexConservativeDistanceUtil
});

btDispatcherInfo.prototype["get_m_convexConservativeDistanceThreshold"] = btDispatcherInfo.prototype.get_m_convexConservativeDistanceThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0(self);
};

btDispatcherInfo.prototype["set_m_convexConservativeDistanceThreshold"] = btDispatcherInfo.prototype.set_m_convexConservativeDistanceThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_convexConservativeDistanceThreshold", {
 get: btDispatcherInfo.prototype.get_m_convexConservativeDistanceThreshold,
 set: btDispatcherInfo.prototype.set_m_convexConservativeDistanceThreshold
});

btDispatcherInfo.prototype["__destroy__"] = btDispatcherInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDispatcherInfo___destroy___0(self);
};

function btContactSolverInfo() {
 throw "cannot construct a btContactSolverInfo, no constructor in IDL";
}

btContactSolverInfo.prototype = Object.create(WrapperObject.prototype);

btContactSolverInfo.prototype.constructor = btContactSolverInfo;

btContactSolverInfo.prototype.__class__ = btContactSolverInfo;

btContactSolverInfo.__cache__ = {};

Module["btContactSolverInfo"] = btContactSolverInfo;

btContactSolverInfo.prototype["get_m_splitImpulse"] = btContactSolverInfo.prototype.get_m_splitImpulse = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0(self);
};

btContactSolverInfo.prototype["set_m_splitImpulse"] = btContactSolverInfo.prototype.set_m_splitImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_splitImpulse", {
 get: btContactSolverInfo.prototype.get_m_splitImpulse,
 set: btContactSolverInfo.prototype.set_m_splitImpulse
});

btContactSolverInfo.prototype["get_m_splitImpulsePenetrationThreshold"] = btContactSolverInfo.prototype.get_m_splitImpulsePenetrationThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0(self);
};

btContactSolverInfo.prototype["set_m_splitImpulsePenetrationThreshold"] = btContactSolverInfo.prototype.set_m_splitImpulsePenetrationThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_splitImpulsePenetrationThreshold", {
 get: btContactSolverInfo.prototype.get_m_splitImpulsePenetrationThreshold,
 set: btContactSolverInfo.prototype.set_m_splitImpulsePenetrationThreshold
});

btContactSolverInfo.prototype["get_m_numIterations"] = btContactSolverInfo.prototype.get_m_numIterations = function() {
 var self = this.ptr;
 return _emscripten_bind_btContactSolverInfo_get_m_numIterations_0(self);
};

btContactSolverInfo.prototype["set_m_numIterations"] = btContactSolverInfo.prototype.set_m_numIterations = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_numIterations_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_numIterations", {
 get: btContactSolverInfo.prototype.get_m_numIterations,
 set: btContactSolverInfo.prototype.set_m_numIterations
});

btContactSolverInfo.prototype["__destroy__"] = btContactSolverInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btContactSolverInfo___destroy___0(self);
};

function btDiscreteDynamicsWorld(dispatcher, pairCache, constraintSolver, collisionConfiguration) {
 if (dispatcher && typeof dispatcher === "object") dispatcher = dispatcher.ptr;
 if (pairCache && typeof pairCache === "object") pairCache = pairCache.ptr;
 if (constraintSolver && typeof constraintSolver === "object") constraintSolver = constraintSolver.ptr;
 if (collisionConfiguration && typeof collisionConfiguration === "object") collisionConfiguration = collisionConfiguration.ptr;
 this.ptr = _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4(dispatcher, pairCache, constraintSolver, collisionConfiguration);
 getCache(btDiscreteDynamicsWorld)[this.ptr] = this;
}

btDiscreteDynamicsWorld.prototype = Object.create(btDynamicsWorld.prototype);

btDiscreteDynamicsWorld.prototype.constructor = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.prototype.__class__ = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.__cache__ = {};

Module["btDiscreteDynamicsWorld"] = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.prototype["setGravity"] = btDiscreteDynamicsWorld.prototype.setGravity = function(gravity) {
 var self = this.ptr;
 if (gravity && typeof gravity === "object") gravity = gravity.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1(self, gravity);
};

btDiscreteDynamicsWorld.prototype["getGravity"] = btDiscreteDynamicsWorld.prototype.getGravity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0(self), btVector3);
};

btDiscreteDynamicsWorld.prototype["addRigidBody"] = btDiscreteDynamicsWorld.prototype.addRigidBody = function(body, group, mask) {
 var self = this.ptr;
 if (body && typeof body === "object") body = body.ptr;
 if (group && typeof group === "object") group = group.ptr;
 if (mask && typeof mask === "object") mask = mask.ptr;
 if (group === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1(self, body);
  return;
 }
 if (mask === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_2(self, body, group);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3(self, body, group, mask);
};

btDiscreteDynamicsWorld.prototype["removeRigidBody"] = btDiscreteDynamicsWorld.prototype.removeRigidBody = function(body) {
 var self = this.ptr;
 if (body && typeof body === "object") body = body.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1(self, body);
};

btDiscreteDynamicsWorld.prototype["stepSimulation"] = btDiscreteDynamicsWorld.prototype.stepSimulation = function(timeStep, maxSubSteps, fixedTimeStep) {
 var self = this.ptr;
 if (timeStep && typeof timeStep === "object") timeStep = timeStep.ptr;
 if (maxSubSteps && typeof maxSubSteps === "object") maxSubSteps = maxSubSteps.ptr;
 if (fixedTimeStep && typeof fixedTimeStep === "object") fixedTimeStep = fixedTimeStep.ptr;
 if (maxSubSteps === undefined) {
  return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1(self, timeStep);
 }
 if (fixedTimeStep === undefined) {
  return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2(self, timeStep, maxSubSteps);
 }
 return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3(self, timeStep, maxSubSteps, fixedTimeStep);
};

btDiscreteDynamicsWorld.prototype["getDispatcher"] = btDiscreteDynamicsWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDiscreteDynamicsWorld.prototype["addCollisionObject"] = btDiscreteDynamicsWorld.prototype.addCollisionObject = function(collisionObject, collisionFilterGroup, collisionFilterMask) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 if (collisionFilterGroup && typeof collisionFilterGroup === "object") collisionFilterGroup = collisionFilterGroup.ptr;
 if (collisionFilterMask && typeof collisionFilterMask === "object") collisionFilterMask = collisionFilterMask.ptr;
 if (collisionFilterGroup === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1(self, collisionObject);
  return;
 }
 if (collisionFilterMask === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2(self, collisionObject, collisionFilterGroup);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3(self, collisionObject, collisionFilterGroup, collisionFilterMask);
};

btDiscreteDynamicsWorld.prototype["removeCollisionObject"] = btDiscreteDynamicsWorld.prototype.removeCollisionObject = function(collisionObject) {
 var self = this.ptr;
 if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1(self, collisionObject);
};

btDiscreteDynamicsWorld.prototype["getBroadphase"] = btDiscreteDynamicsWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDiscreteDynamicsWorld.prototype["addAction"] = btDiscreteDynamicsWorld.prototype.addAction = function(action) {
 var self = this.ptr;
 if (action && typeof action === "object") action = action.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_addAction_1(self, action);
};

btDiscreteDynamicsWorld.prototype["removeAction"] = btDiscreteDynamicsWorld.prototype.removeAction = function(action) {
 var self = this.ptr;
 if (action && typeof action === "object") action = action.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeAction_1(self, action);
};

btDiscreteDynamicsWorld.prototype["getSolverInfo"] = btDiscreteDynamicsWorld.prototype.getSolverInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0(self), btContactSolverInfo);
};

btDiscreteDynamicsWorld.prototype["setInternalTickCallback"] = btDiscreteDynamicsWorld.prototype.setInternalTickCallback = function(cb, worldUserInfo, isPreTick) {
 var self = this.ptr;
 if (cb && typeof cb === "object") cb = cb.ptr;
 if (worldUserInfo && typeof worldUserInfo === "object") worldUserInfo = worldUserInfo.ptr;
 if (isPreTick && typeof isPreTick === "object") isPreTick = isPreTick.ptr;
 if (worldUserInfo === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_1(self, cb);
  return;
 }
 if (isPreTick === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_2(self, cb, worldUserInfo);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_setInternalTickCallback_3(self, cb, worldUserInfo, isPreTick);
};

btDiscreteDynamicsWorld.prototype["__destroy__"] = btDiscreteDynamicsWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld___destroy___0(self);
};

function btKinematicCharacterController(ghostObject, convexShape, stepHeight, up) {
 if (ghostObject && typeof ghostObject === "object") ghostObject = ghostObject.ptr;
 if (convexShape && typeof convexShape === "object") convexShape = convexShape.ptr;
 if (stepHeight && typeof stepHeight === "object") stepHeight = stepHeight.ptr;
 if (up && typeof up === "object") up = up.ptr;
 if (up === undefined) {
  this.ptr = _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3(ghostObject, convexShape, stepHeight);
  getCache(btKinematicCharacterController)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4(ghostObject, convexShape, stepHeight, up);
 getCache(btKinematicCharacterController)[this.ptr] = this;
}

btKinematicCharacterController.prototype = Object.create(btActionInterface.prototype);

btKinematicCharacterController.prototype.constructor = btKinematicCharacterController;

btKinematicCharacterController.prototype.__class__ = btKinematicCharacterController;

btKinematicCharacterController.__cache__ = {};

Module["btKinematicCharacterController"] = btKinematicCharacterController;

btKinematicCharacterController.prototype["setUp"] = btKinematicCharacterController.prototype.setUp = function(up) {
 var self = this.ptr;
 if (up && typeof up === "object") up = up.ptr;
 _emscripten_bind_btKinematicCharacterController_setUp_1(self, up);
};

btKinematicCharacterController.prototype["setWalkDirection"] = btKinematicCharacterController.prototype.setWalkDirection = function(walkDirection) {
 var self = this.ptr;
 if (walkDirection && typeof walkDirection === "object") walkDirection = walkDirection.ptr;
 _emscripten_bind_btKinematicCharacterController_setWalkDirection_1(self, walkDirection);
};

btKinematicCharacterController.prototype["warp"] = btKinematicCharacterController.prototype.warp = function(origin) {
 var self = this.ptr;
 if (origin && typeof origin === "object") origin = origin.ptr;
 _emscripten_bind_btKinematicCharacterController_warp_1(self, origin);
};

btKinematicCharacterController.prototype["preStep"] = btKinematicCharacterController.prototype.preStep = function(collisionWorld) {
 var self = this.ptr;
 if (collisionWorld && typeof collisionWorld === "object") collisionWorld = collisionWorld.ptr;
 _emscripten_bind_btKinematicCharacterController_preStep_1(self, collisionWorld);
};

btKinematicCharacterController.prototype["playerStep"] = btKinematicCharacterController.prototype.playerStep = function(collisionWorld, dt) {
 var self = this.ptr;
 if (collisionWorld && typeof collisionWorld === "object") collisionWorld = collisionWorld.ptr;
 if (dt && typeof dt === "object") dt = dt.ptr;
 _emscripten_bind_btKinematicCharacterController_playerStep_2(self, collisionWorld, dt);
};

btKinematicCharacterController.prototype["setFallSpeed"] = btKinematicCharacterController.prototype.setFallSpeed = function(fallSpeed) {
 var self = this.ptr;
 if (fallSpeed && typeof fallSpeed === "object") fallSpeed = fallSpeed.ptr;
 _emscripten_bind_btKinematicCharacterController_setFallSpeed_1(self, fallSpeed);
};

btKinematicCharacterController.prototype["setJumpSpeed"] = btKinematicCharacterController.prototype.setJumpSpeed = function(jumpSpeed) {
 var self = this.ptr;
 if (jumpSpeed && typeof jumpSpeed === "object") jumpSpeed = jumpSpeed.ptr;
 _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1(self, jumpSpeed);
};

btKinematicCharacterController.prototype["setMaxJumpHeight"] = btKinematicCharacterController.prototype.setMaxJumpHeight = function(maxJumpHeight) {
 var self = this.ptr;
 if (maxJumpHeight && typeof maxJumpHeight === "object") maxJumpHeight = maxJumpHeight.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1(self, maxJumpHeight);
};

btKinematicCharacterController.prototype["canJump"] = btKinematicCharacterController.prototype.canJump = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_canJump_0(self);
};

btKinematicCharacterController.prototype["jump"] = btKinematicCharacterController.prototype.jump = function(up) {
 var self = this.ptr;
 if (up && typeof up === "object") up = up.ptr;
 if (up === undefined) {
  _emscripten_bind_btKinematicCharacterController_jump_0(self);
  return;
 }
 _emscripten_bind_btKinematicCharacterController_jump_1(self, up);
};

btKinematicCharacterController.prototype["setGravity"] = btKinematicCharacterController.prototype.setGravity = function(gravity) {
 var self = this.ptr;
 if (gravity && typeof gravity === "object") gravity = gravity.ptr;
 _emscripten_bind_btKinematicCharacterController_setGravity_1(self, gravity);
};

btKinematicCharacterController.prototype["getGravity"] = btKinematicCharacterController.prototype.getGravity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btKinematicCharacterController_getGravity_0(self), btVector3);
};

btKinematicCharacterController.prototype["setMaxSlope"] = btKinematicCharacterController.prototype.setMaxSlope = function(slopeRadians) {
 var self = this.ptr;
 if (slopeRadians && typeof slopeRadians === "object") slopeRadians = slopeRadians.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxSlope_1(self, slopeRadians);
};

btKinematicCharacterController.prototype["setUseGhostSweepTest"] = btKinematicCharacterController.prototype.setUseGhostSweepTest = function(useGhostObjectSweepTest) {
 var self = this.ptr;
 if (useGhostObjectSweepTest && typeof useGhostObjectSweepTest === "object") useGhostObjectSweepTest = useGhostObjectSweepTest.ptr;
 _emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1(self, useGhostObjectSweepTest);
};

btKinematicCharacterController.prototype["onGround"] = btKinematicCharacterController.prototype.onGround = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_onGround_0(self);
};

btKinematicCharacterController.prototype["setUpInterpolate"] = btKinematicCharacterController.prototype.setUpInterpolate = function(value) {
 var self = this.ptr;
 if (value && typeof value === "object") value = value.ptr;
 _emscripten_bind_btKinematicCharacterController_setUpInterpolate_1(self, value);
};

btKinematicCharacterController.prototype["setMaxPenetrationDepth"] = btKinematicCharacterController.prototype.setMaxPenetrationDepth = function(d) {
 var self = this.ptr;
 if (d && typeof d === "object") d = d.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1(self, d);
};

btKinematicCharacterController.prototype["getMaxPenetrationDepth"] = btKinematicCharacterController.prototype.getMaxPenetrationDepth = function() {
 var self = this.ptr;
 return _emscripten_bind_btKinematicCharacterController_getMaxPenetrationDepth_0(self);
};

btKinematicCharacterController.prototype["setStepHeight"] = btKinematicCharacterController.prototype.setStepHeight = function(h) {
 var self = this.ptr;
 if (h && typeof h === "object") h = h.ptr;
 _emscripten_bind_btKinematicCharacterController_setStepHeight_1(self, h);
};

btKinematicCharacterController.prototype["updateAction"] = btKinematicCharacterController.prototype.updateAction = function(collisionWorld, deltaTimeStep) {
 var self = this.ptr;
 if (collisionWorld && typeof collisionWorld === "object") collisionWorld = collisionWorld.ptr;
 if (deltaTimeStep && typeof deltaTimeStep === "object") deltaTimeStep = deltaTimeStep.ptr;
 _emscripten_bind_btKinematicCharacterController_updateAction_2(self, collisionWorld, deltaTimeStep);
};

btKinematicCharacterController.prototype["__destroy__"] = btKinematicCharacterController.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btKinematicCharacterController___destroy___0(self);
};

function btPairCachingGhostObject() {
 this.ptr = _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0();
 getCache(btPairCachingGhostObject)[this.ptr] = this;
}

btPairCachingGhostObject.prototype = Object.create(btGhostObject.prototype);

btPairCachingGhostObject.prototype.constructor = btPairCachingGhostObject;

btPairCachingGhostObject.prototype.__class__ = btPairCachingGhostObject;

btPairCachingGhostObject.__cache__ = {};

Module["btPairCachingGhostObject"] = btPairCachingGhostObject;

btPairCachingGhostObject.prototype["getCollisionShape"] = btPairCachingGhostObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0(self), btCollisionShape);
};

btPairCachingGhostObject.prototype["isStaticObject"] = btPairCachingGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isStaticObject_0(self);
};

btPairCachingGhostObject.prototype["setFriction"] = btPairCachingGhostObject.prototype.setFriction = function(frict) {
 var self = this.ptr;
 if (frict && typeof frict === "object") frict = frict.ptr;
 _emscripten_bind_btPairCachingGhostObject_setFriction_1(self, frict);
};

btPairCachingGhostObject.prototype["getWorldTransform"] = btPairCachingGhostObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0(self), btTransform);
};

btPairCachingGhostObject.prototype["setCollisionFlags"] = btPairCachingGhostObject.prototype.setCollisionFlags = function(flags) {
 var self = this.ptr;
 if (flags && typeof flags === "object") flags = flags.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1(self, flags);
};

btPairCachingGhostObject.prototype["setWorldTransform"] = btPairCachingGhostObject.prototype.setWorldTransform = function(worldTrans) {
 var self = this.ptr;
 if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
 _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1(self, worldTrans);
};

btPairCachingGhostObject.prototype["setCollisionShape"] = btPairCachingGhostObject.prototype.setCollisionShape = function(collisionShape) {
 var self = this.ptr;
 if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1(self, collisionShape);
};

btPairCachingGhostObject.prototype["getNumOverlappingObjects"] = btPairCachingGhostObject.prototype.getNumOverlappingObjects = function() {
 var self = this.ptr;
 return _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0(self);
};

btPairCachingGhostObject.prototype["getOverlappingObject"] = btPairCachingGhostObject.prototype.getOverlappingObject = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1(self, index), btCollisionObject);
};

btPairCachingGhostObject.prototype["__destroy__"] = btPairCachingGhostObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPairCachingGhostObject___destroy___0(self);
};

function btGhostPairCallback() {
 this.ptr = _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0();
 getCache(btGhostPairCallback)[this.ptr] = this;
}

btGhostPairCallback.prototype = Object.create(WrapperObject.prototype);

btGhostPairCallback.prototype.constructor = btGhostPairCallback;

btGhostPairCallback.prototype.__class__ = btGhostPairCallback;

btGhostPairCallback.__cache__ = {};

Module["btGhostPairCallback"] = btGhostPairCallback;

btGhostPairCallback.prototype["__destroy__"] = btGhostPairCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGhostPairCallback___destroy___0(self);
};

(function() {
 function setupEnums() {
  Module["PHY_FLOAT"] = _emscripten_enum_PHY_ScalarType_PHY_FLOAT();
  Module["PHY_DOUBLE"] = _emscripten_enum_PHY_ScalarType_PHY_DOUBLE();
  Module["PHY_INTEGER"] = _emscripten_enum_PHY_ScalarType_PHY_INTEGER();
  Module["PHY_SHORT"] = _emscripten_enum_PHY_ScalarType_PHY_SHORT();
  Module["PHY_FIXEDPOINT88"] = _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88();
  Module["PHY_UCHAR"] = _emscripten_enum_PHY_ScalarType_PHY_UCHAR();
  Module["CONST_GIMPACT_COMPOUND_SHAPE"] = _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_COMPOUND_SHAPE();
  Module["CONST_GIMPACT_TRIMESH_SHAPE_PART"] = _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE_PART();
  Module["CONST_GIMPACT_TRIMESH_SHAPE"] = _emscripten_enum_eGIMPACT_SHAPE_TYPE_CONST_GIMPACT_TRIMESH_SHAPE();
  Module["BT_CONSTRAINT_ERP"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP();
  Module["BT_CONSTRAINT_STOP_ERP"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP();
  Module["BT_CONSTRAINT_CFM"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM();
  Module["BT_CONSTRAINT_STOP_CFM"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM();
 }
 if (runtimeInitialized) setupEnums(); else addOnInit(setupEnums);
})();

Module["CONTACT_ADDED_CALLBACK_SIGNATURE"] = "iiiiiiii";

Module["CONTACT_DESTROYED_CALLBACK_SIGNATURE"] = "ii";

Module["CONTACT_PROCESSED_CALLBACK_SIGNATURE"] = "iiii";

Module["INTERNAL_TICK_CALLBACK_SIGNATURE"] = "vif";

this["Ammo"] = Module;


  return moduleArg.ready
}

);
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = Ammo;
else if (typeof define === 'function' && define['amd'])
  define([], () => Ammo);
export {Ammo};
