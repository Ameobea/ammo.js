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
  wasmTable = wasmExports["Gc"];
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

var _free = Module["_free"] = a0 => (_free = Module["_free"] = wasmExports["h"])(a0);

var _webidl_malloc = Module["_webidl_malloc"] = a0 => (_webidl_malloc = Module["_webidl_malloc"] = wasmExports["i"])(a0);

var _malloc = Module["_malloc"] = a0 => (_malloc = Module["_malloc"] = wasmExports["j"])(a0);

var _emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = a0 => (_emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = wasmExports["k"])(a0);

var _emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = wasmExports["l"])(a0);

var _emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = wasmExports["m"])(a0, a1);

var _emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = wasmExports["n"])(a0, a1);

var _emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = wasmExports["o"])(a0, a1);

var _emscripten_bind_btCollisionObject_setUserIndex_1 = Module["_emscripten_bind_btCollisionObject_setUserIndex_1"] = (a0, a1) => (_emscripten_bind_btCollisionObject_setUserIndex_1 = Module["_emscripten_bind_btCollisionObject_setUserIndex_1"] = wasmExports["p"])(a0, a1);

var _emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = a0 => (_emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = wasmExports["q"])(a0);

var _emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = wasmExports["r"])(a0, a1);

var _emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = a0 => (_emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = wasmExports["s"])(a0);

var _emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = wasmExports["t"])(a0);

var _emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = wasmExports["u"])(a0, a1);

var _emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = wasmExports["v"])(a0, a1, a2);

var _emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = wasmExports["w"])(a0, a1, a2, a3);

var _emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = wasmExports["x"])(a0, a1);

var _emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = wasmExports["y"])(a0);

var _emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = a0 => (_emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = wasmExports["z"])(a0);

var _emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = wasmExports["A"])(a0, a1);

var _emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = wasmExports["B"])(a0, a1);

var _emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = a0 => (_emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = wasmExports["C"])(a0);

var _emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = a0 => (_emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = wasmExports["D"])(a0);

var _emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = wasmExports["E"])(a0, a1);

var _emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = a0 => (_emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = wasmExports["F"])(a0);

var _emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = a0 => (_emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = wasmExports["G"])(a0);

var _emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = wasmExports["H"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = wasmExports["I"])(a0);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = wasmExports["J"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = wasmExports["K"])(a0, a1, a2);

var _emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = wasmExports["L"])(a0, a1, a2, a3);

var _emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = wasmExports["M"])(a0, a1);

var _emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = wasmExports["N"])(a0);

var _emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = a0 => (_emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = wasmExports["O"])(a0);

var _emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = a0 => (_emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = wasmExports["P"])(a0);

var _emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = () => (_emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = wasmExports["Q"])();

var _emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = a0 => (_emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = wasmExports["R"])(a0);

var _emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = a0 => (_emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = wasmExports["S"])(a0);

var _emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = wasmExports["T"])(a0);

var _emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = wasmExports["U"])(a0, a1);

var _emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = wasmExports["V"])(a0, a1);

var _emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = wasmExports["W"])(a0, a1);

var _emscripten_bind_btGhostObject_setUserIndex_1 = Module["_emscripten_bind_btGhostObject_setUserIndex_1"] = (a0, a1) => (_emscripten_bind_btGhostObject_setUserIndex_1 = Module["_emscripten_bind_btGhostObject_setUserIndex_1"] = wasmExports["X"])(a0, a1);

var _emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = a0 => (_emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = wasmExports["Y"])(a0);

var _emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = a0 => (_emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = wasmExports["Z"])(a0);

var _emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = () => (_emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = wasmExports["_"])();

var _emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = (a0, a1, a2) => (_emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = wasmExports["$"])(a0, a1, a2);

var _emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = a0 => (_emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = wasmExports["aa"])(a0);

var _emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = a0 => (_emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = wasmExports["ba"])(a0);

var _emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = a0 => (_emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = wasmExports["ca"])(a0);

var _emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = a0 => (_emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = wasmExports["da"])(a0);

var _emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = wasmExports["ea"])(a0, a1, a2, a3);

var _emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = a0 => (_emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = wasmExports["fa"])(a0);

var _emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = wasmExports["ga"])(a0, a1, a2, a3);

var _emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = a0 => (_emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = wasmExports["ha"])(a0);

var _emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = () => (_emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = wasmExports["ia"])();

var _emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = (a0, a1) => (_emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = wasmExports["ja"])(a0, a1);

var _emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = a0 => (_emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = wasmExports["ka"])(a0);

var _emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = (a0, a1) => (_emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = wasmExports["la"])(a0, a1);

var _emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = (a0, a1) => (_emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = wasmExports["ma"])(a0, a1);

var _emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = a0 => (_emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = wasmExports["na"])(a0);

var _emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = a0 => (_emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = wasmExports["oa"])(a0);

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = () => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = wasmExports["pa"])();

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = a0 => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = wasmExports["qa"])(a0);

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = wasmExports["ra"])(a0, a1);

var _emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = wasmExports["sa"])(a0, a1);

var _emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = wasmExports["ta"])(a0, a1);

var _emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = a0 => (_emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = wasmExports["ua"])(a0);

var _emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = wasmExports["va"])(a0, a1);

var _emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = a0 => (_emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = wasmExports["wa"])(a0);

var _emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = a0 => (_emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = wasmExports["xa"])(a0);

var _emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = wasmExports["ya"])(a0, a1);

var _emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = a0 => (_emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = wasmExports["za"])(a0);

var _emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = (a0, a1) => (_emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = wasmExports["Aa"])(a0, a1);

var _emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = wasmExports["Ba"])(a0, a1);

var _emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = a0 => (_emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = wasmExports["Ca"])(a0);

var _emscripten_bind_btConeShape_btConeShape_2 = Module["_emscripten_bind_btConeShape_btConeShape_2"] = (a0, a1) => (_emscripten_bind_btConeShape_btConeShape_2 = Module["_emscripten_bind_btConeShape_btConeShape_2"] = wasmExports["Da"])(a0, a1);

var _emscripten_bind_btConeShape_setLocalScaling_1 = Module["_emscripten_bind_btConeShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConeShape_setLocalScaling_1 = Module["_emscripten_bind_btConeShape_setLocalScaling_1"] = wasmExports["Ea"])(a0, a1);

var _emscripten_bind_btConeShape___destroy___0 = Module["_emscripten_bind_btConeShape___destroy___0"] = a0 => (_emscripten_bind_btConeShape___destroy___0 = Module["_emscripten_bind_btConeShape___destroy___0"] = wasmExports["Fa"])(a0);

var _emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = () => (_emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = wasmExports["Ga"])();

var _emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = a0 => (_emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = wasmExports["Ha"])(a0);

var _emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = wasmExports["Ia"])(a0, a1);

var _emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = wasmExports["Ja"])(a0, a1);

var _emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = (a0, a1, a2) => (_emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = wasmExports["Ka"])(a0, a1, a2);

var _emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = wasmExports["La"])(a0, a1);

var _emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = a0 => (_emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = wasmExports["Ma"])(a0);

var _emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = () => (_emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = wasmExports["Na"])();

var _emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = a0 => (_emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = wasmExports["Oa"])(a0);

var _emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = (a0, a1, a2) => (_emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = wasmExports["Pa"])(a0, a1, a2);

var _emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = wasmExports["Qa"])(a0, a1);

var _emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = a0 => (_emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = wasmExports["Ra"])(a0);

var _emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = () => (_emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = wasmExports["Sa"])();

var _emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = a0 => (_emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = wasmExports["Ta"])(a0);

var _emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = wasmExports["Ua"])(a0, a1);

var _emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = wasmExports["Va"])(a0, a1, a2, a3);

var _emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = (a0, a1, a2, a3, a4) => (_emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = wasmExports["Wa"])(a0, a1, a2, a3, a4);

var _emscripten_bind_btTriangleMesh_preallocateIndices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateIndices_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_preallocateIndices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateIndices_1"] = wasmExports["Xa"])(a0, a1);

var _emscripten_bind_btTriangleMesh_preallocateVertices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateVertices_1"] = (a0, a1) => (_emscripten_bind_btTriangleMesh_preallocateVertices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateVertices_1"] = wasmExports["Ya"])(a0, a1);

var _emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = a0 => (_emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = wasmExports["Za"])(a0);

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = (a0, a1) => (_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = wasmExports["_a"])(a0, a1);

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = (a0, a1, a2) => (_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = wasmExports["$a"])(a0, a1, a2);

var _emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = a0 => (_emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = wasmExports["ab"])(a0);

var _emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9 = Module["_emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9"] = (a0, a1, a2, a3, a4, a5, a6, a7, a8) => (_emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9 = Module["_emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9"] = wasmExports["bb"])(a0, a1, a2, a3, a4, a5, a6, a7, a8);

var _emscripten_bind_btHeightfieldTerrainShape_setMargin_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setMargin_1"] = (a0, a1) => (_emscripten_bind_btHeightfieldTerrainShape_setMargin_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setMargin_1"] = wasmExports["cb"])(a0, a1);

var _emscripten_bind_btHeightfieldTerrainShape_getMargin_0 = Module["_emscripten_bind_btHeightfieldTerrainShape_getMargin_0"] = a0 => (_emscripten_bind_btHeightfieldTerrainShape_getMargin_0 = Module["_emscripten_bind_btHeightfieldTerrainShape_getMargin_0"] = wasmExports["db"])(a0);

var _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1"] = (a0, a1) => (_emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1"] = wasmExports["eb"])(a0, a1);

var _emscripten_bind_btHeightfieldTerrainShape___destroy___0 = Module["_emscripten_bind_btHeightfieldTerrainShape___destroy___0"] = a0 => (_emscripten_bind_btHeightfieldTerrainShape___destroy___0 = Module["_emscripten_bind_btHeightfieldTerrainShape___destroy___0"] = wasmExports["fb"])(a0);

var _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = () => (_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = wasmExports["gb"])();

var _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = a0 => (_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = wasmExports["hb"])(a0);

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = () => (_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = wasmExports["ib"])();

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = a0 => (_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = wasmExports["jb"])(a0);

var _emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = a0 => (_emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = wasmExports["kb"])(a0);

var _emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = a0 => (_emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = wasmExports["lb"])(a0);

var _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = a0 => (_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = wasmExports["mb"])(a0);

var _emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = a0 => (_emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = wasmExports["nb"])(a0);

var _emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = a0 => (_emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = wasmExports["ob"])(a0);

var _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = (a0, a1) => (_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = wasmExports["pb"])(a0, a1);

var _emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = a0 => (_emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = wasmExports["qb"])(a0);

var _emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0 = Module["_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0"] = a0 => (_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0 = Module["_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0"] = wasmExports["rb"])(a0);

var _emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = a0 => (_emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = wasmExports["sb"])(a0);

var _emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = a0 => (_emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = wasmExports["tb"])(a0);

var _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = () => (_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = wasmExports["ub"])();

var _emscripten_bind_btDbvtBroadphase_optimize_0 = Module["_emscripten_bind_btDbvtBroadphase_optimize_0"] = a0 => (_emscripten_bind_btDbvtBroadphase_optimize_0 = Module["_emscripten_bind_btDbvtBroadphase_optimize_0"] = wasmExports["vb"])(a0);

var _emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = a0 => (_emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = wasmExports["wb"])(a0);

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = (a0, a1, a2) => (_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = wasmExports["xb"])(a0, a1, a2);

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = wasmExports["yb"])(a0, a1, a2, a3);

var _emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = a0 => (_emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = wasmExports["zb"])(a0);

var _emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = a0 => (_emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = wasmExports["Ab"])(a0);

var _emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = a0 => (_emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = wasmExports["Bb"])(a0);

var _emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = a0 => (_emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = wasmExports["Cb"])(a0);

var _emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = wasmExports["Db"])(a0, a1);

var _emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = wasmExports["Eb"])(a0, a1);

var _emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = wasmExports["Fb"])(a0, a1);

var _emscripten_bind_btRigidBody_setUserIndex_1 = Module["_emscripten_bind_btRigidBody_setUserIndex_1"] = (a0, a1) => (_emscripten_bind_btRigidBody_setUserIndex_1 = Module["_emscripten_bind_btRigidBody_setUserIndex_1"] = wasmExports["Gb"])(a0, a1);

var _emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = a0 => (_emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = wasmExports["Hb"])(a0);

var _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = () => (_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = wasmExports["Ib"])();

var _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = a0 => (_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = wasmExports["Jb"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = wasmExports["Kb"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = wasmExports["Lb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = wasmExports["Mb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = wasmExports["Nb"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = wasmExports["Ob"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = wasmExports["Pb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = (a0, a1, a2) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = wasmExports["Qb"])(a0, a1, a2);

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = wasmExports["Rb"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = wasmExports["Sb"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = wasmExports["Tb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = (a0, a1, a2) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = wasmExports["Ub"])(a0, a1, a2);

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = (a0, a1, a2, a3) => (_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = wasmExports["Vb"])(a0, a1, a2, a3);

var _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = wasmExports["Wb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = wasmExports["Xb"])(a0);

var _emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = (a0, a1) => (_emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = wasmExports["Yb"])(a0, a1);

var _emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = a0 => (_emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = wasmExports["Zb"])(a0);

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = (a0, a1, a2) => (_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = wasmExports["_b"])(a0, a1, a2);

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = (a0, a1, a2, a3) => (_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = wasmExports["$b"])(a0, a1, a2, a3);

var _emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = wasmExports["ac"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = wasmExports["bc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = wasmExports["cc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = wasmExports["dc"])(a0);

var _emscripten_bind_btKinematicCharacterController_jump_1 = Module["_emscripten_bind_btKinematicCharacterController_jump_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_jump_1 = Module["_emscripten_bind_btKinematicCharacterController_jump_1"] = wasmExports["ec"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = wasmExports["fc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_getGravity_0 = Module["_emscripten_bind_btKinematicCharacterController_getGravity_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_getGravity_0 = Module["_emscripten_bind_btKinematicCharacterController_getGravity_0"] = wasmExports["gc"])(a0);

var _emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = wasmExports["hc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = wasmExports["ic"])(a0);

var _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1"] = wasmExports["jc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_setStepHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setStepHeight_1"] = (a0, a1) => (_emscripten_bind_btKinematicCharacterController_setStepHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setStepHeight_1"] = wasmExports["kc"])(a0, a1);

var _emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0 = Module["_emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0 = Module["_emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0"] = wasmExports["lc"])(a0);

var _emscripten_bind_btKinematicCharacterController_isJumping_0 = Module["_emscripten_bind_btKinematicCharacterController_isJumping_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_isJumping_0 = Module["_emscripten_bind_btKinematicCharacterController_isJumping_0"] = wasmExports["mc"])(a0);

var _emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0 = Module["_emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0"] = a0 => (_emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0 = Module["_emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0"] = wasmExports["nc"])(a0);

var _emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = a0 => (_emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = wasmExports["oc"])(a0);

var _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = () => (_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = wasmExports["pc"])();

var _emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = wasmExports["qc"])(a0);

var _emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = wasmExports["rc"])(a0);

var _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = wasmExports["sc"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = wasmExports["tc"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = wasmExports["uc"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_setUserIndex_1 = Module["_emscripten_bind_btPairCachingGhostObject_setUserIndex_1"] = (a0, a1) => (_emscripten_bind_btPairCachingGhostObject_setUserIndex_1 = Module["_emscripten_bind_btPairCachingGhostObject_setUserIndex_1"] = wasmExports["vc"])(a0, a1);

var _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = a0 => (_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = wasmExports["wc"])(a0);

var _emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = a0 => (_emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = wasmExports["xc"])(a0);

var _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = () => (_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = wasmExports["yc"])();

var _emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = a0 => (_emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = wasmExports["zc"])(a0);

var _emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = () => (_emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = wasmExports["Ac"])();

var _emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = () => (_emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = wasmExports["Bc"])();

var _emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = () => (_emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = wasmExports["Cc"])();

var _emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = () => (_emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = wasmExports["Dc"])();

var _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = () => (_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = wasmExports["Ec"])();

var _emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = () => (_emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = wasmExports["Fc"])();

var ___errno_location = () => (___errno_location = wasmExports["__errno_location"])();

var ___start_em_js = Module["___start_em_js"] = 18402;

var ___stop_em_js = Module["___stop_em_js"] = 18500;

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

function btCollisionObject() {
 throw "cannot construct a btCollisionObject, no constructor in IDL";
}

btCollisionObject.prototype = Object.create(WrapperObject.prototype);

btCollisionObject.prototype.constructor = btCollisionObject;

btCollisionObject.prototype.__class__ = btCollisionObject;

btCollisionObject.__cache__ = {};

Module["btCollisionObject"] = btCollisionObject;

btCollisionObject.prototype["isStaticObject"] = btCollisionObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isStaticObject_0(self);
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

btCollisionObject.prototype["setUserIndex"] = btCollisionObject.prototype.setUserIndex = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 _emscripten_bind_btCollisionObject_setUserIndex_1(self, index);
};

btCollisionObject.prototype["__destroy__"] = btCollisionObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionObject___destroy___0(self);
};

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

btCollisionShape.prototype["__destroy__"] = btCollisionShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionShape___destroy___0(self);
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

function btStridingMeshInterface() {
 throw "cannot construct a btStridingMeshInterface, no constructor in IDL";
}

btStridingMeshInterface.prototype = Object.create(WrapperObject.prototype);

btStridingMeshInterface.prototype.constructor = btStridingMeshInterface;

btStridingMeshInterface.prototype.__class__ = btStridingMeshInterface;

btStridingMeshInterface.__cache__ = {};

Module["btStridingMeshInterface"] = btStridingMeshInterface;

btStridingMeshInterface.prototype["__destroy__"] = btStridingMeshInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btStridingMeshInterface___destroy___0(self);
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

btConcaveShape.prototype["__destroy__"] = btConcaveShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConcaveShape___destroy___0(self);
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

btGhostObject.prototype["isStaticObject"] = btGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isStaticObject_0(self);
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

btGhostObject.prototype["setUserIndex"] = btGhostObject.prototype.setUserIndex = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 _emscripten_bind_btGhostObject_setUserIndex_1(self, index);
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

btVector3.prototype["setValue"] = btVector3.prototype.setValue = function(x, y, z) {
 var self = this.ptr;
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 _emscripten_bind_btVector3_setValue_3(self, x, y, z);
};

btVector3.prototype["__destroy__"] = btVector3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3___destroy___0(self);
};

function btQuaternion(x, y, z, w) {
 if (x && typeof x === "object") x = x.ptr;
 if (y && typeof y === "object") y = y.ptr;
 if (z && typeof z === "object") z = z.ptr;
 if (w && typeof w === "object") w = w.ptr;
 this.ptr = _emscripten_bind_btQuaternion_btQuaternion_4(x, y, z, w);
 getCache(btQuaternion)[this.ptr] = this;
}

btQuaternion.prototype = Object.create(WrapperObject.prototype);

btQuaternion.prototype.constructor = btQuaternion;

btQuaternion.prototype.__class__ = btQuaternion;

btQuaternion.__cache__ = {};

Module["btQuaternion"] = btQuaternion;

btQuaternion.prototype["__destroy__"] = btQuaternion.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btQuaternion___destroy___0(self);
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

btDefaultMotionState.prototype["__destroy__"] = btDefaultMotionState.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultMotionState___destroy___0(self);
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

btConvexShape.prototype["__destroy__"] = btConvexShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexShape___destroy___0(self);
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

btBoxShape.prototype["setLocalScaling"] = btBoxShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btBoxShape_setLocalScaling_1(self, scaling);
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

btCapsuleShape.prototype["setLocalScaling"] = btCapsuleShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btCapsuleShape_setLocalScaling_1(self, scaling);
};

btCapsuleShape.prototype["__destroy__"] = btCapsuleShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCapsuleShape___destroy___0(self);
};

function btConeShape(radius, height) {
 if (radius && typeof radius === "object") radius = radius.ptr;
 if (height && typeof height === "object") height = height.ptr;
 this.ptr = _emscripten_bind_btConeShape_btConeShape_2(radius, height);
 getCache(btConeShape)[this.ptr] = this;
}

btConeShape.prototype = Object.create(btCollisionShape.prototype);

btConeShape.prototype.constructor = btConeShape;

btConeShape.prototype.__class__ = btConeShape;

btConeShape.__cache__ = {};

Module["btConeShape"] = btConeShape;

btConeShape.prototype["setLocalScaling"] = btConeShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConeShape_setLocalScaling_1(self, scaling);
};

btConeShape.prototype["__destroy__"] = btConeShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConeShape___destroy___0(self);
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

btConvexHullShape.prototype["setLocalScaling"] = btConvexHullShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btConvexHullShape_setLocalScaling_1(self, scaling);
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

btCompoundShape.prototype["setLocalScaling"] = btCompoundShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btCompoundShape_setLocalScaling_1(self, scaling);
};

btCompoundShape.prototype["__destroy__"] = btCompoundShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCompoundShape___destroy___0(self);
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

btTriangleMesh.prototype["__destroy__"] = btTriangleMesh.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleMesh___destroy___0(self);
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

btBvhTriangleMeshShape.prototype = Object.create(WrapperObject.prototype);

btBvhTriangleMeshShape.prototype.constructor = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype.__class__ = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.__cache__ = {};

Module["btBvhTriangleMeshShape"] = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype["__destroy__"] = btBvhTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBvhTriangleMeshShape___destroy___0(self);
};

function btHeightfieldTerrainShape(heightStickWidth, heightStickLength, heightfieldData, heightScale, minHeight, maxHeight, upAxis, hdt, flipQuadEdges) {
 if (heightStickWidth && typeof heightStickWidth === "object") heightStickWidth = heightStickWidth.ptr;
 if (heightStickLength && typeof heightStickLength === "object") heightStickLength = heightStickLength.ptr;
 if (heightfieldData && typeof heightfieldData === "object") heightfieldData = heightfieldData.ptr;
 if (heightScale && typeof heightScale === "object") heightScale = heightScale.ptr;
 if (minHeight && typeof minHeight === "object") minHeight = minHeight.ptr;
 if (maxHeight && typeof maxHeight === "object") maxHeight = maxHeight.ptr;
 if (upAxis && typeof upAxis === "object") upAxis = upAxis.ptr;
 if (hdt && typeof hdt === "object") hdt = hdt.ptr;
 if (flipQuadEdges && typeof flipQuadEdges === "object") flipQuadEdges = flipQuadEdges.ptr;
 this.ptr = _emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9(heightStickWidth, heightStickLength, heightfieldData, heightScale, minHeight, maxHeight, upAxis, hdt, flipQuadEdges);
 getCache(btHeightfieldTerrainShape)[this.ptr] = this;
}

btHeightfieldTerrainShape.prototype = Object.create(btConcaveShape.prototype);

btHeightfieldTerrainShape.prototype.constructor = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.prototype.__class__ = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.__cache__ = {};

Module["btHeightfieldTerrainShape"] = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.prototype["setMargin"] = btHeightfieldTerrainShape.prototype.setMargin = function(margin) {
 var self = this.ptr;
 if (margin && typeof margin === "object") margin = margin.ptr;
 _emscripten_bind_btHeightfieldTerrainShape_setMargin_1(self, margin);
};

btHeightfieldTerrainShape.prototype["getMargin"] = btHeightfieldTerrainShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btHeightfieldTerrainShape_getMargin_0(self);
};

btHeightfieldTerrainShape.prototype["setLocalScaling"] = btHeightfieldTerrainShape.prototype.setLocalScaling = function(scaling) {
 var self = this.ptr;
 if (scaling && typeof scaling === "object") scaling = scaling.ptr;
 _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1(self, scaling);
};

btHeightfieldTerrainShape.prototype["__destroy__"] = btHeightfieldTerrainShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btHeightfieldTerrainShape___destroy___0(self);
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

function btDispatcher() {
 throw "cannot construct a btDispatcher, no constructor in IDL";
}

btDispatcher.prototype = Object.create(WrapperObject.prototype);

btDispatcher.prototype.constructor = btDispatcher;

btDispatcher.prototype.__class__ = btDispatcher;

btDispatcher.__cache__ = {};

Module["btDispatcher"] = btDispatcher;

btDispatcher.prototype["__destroy__"] = btDispatcher.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDispatcher___destroy___0(self);
};

function btCollisionDispatcher(conf) {
 if (conf && typeof conf === "object") conf = conf.ptr;
 this.ptr = _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1(conf);
 getCache(btCollisionDispatcher)[this.ptr] = this;
}

btCollisionDispatcher.prototype = Object.create(WrapperObject.prototype);

btCollisionDispatcher.prototype.constructor = btCollisionDispatcher;

btCollisionDispatcher.prototype.__class__ = btCollisionDispatcher;

btCollisionDispatcher.__cache__ = {};

Module["btCollisionDispatcher"] = btCollisionDispatcher;

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

btRigidBody.prototype["isStaticObject"] = btRigidBody.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isStaticObject_0(self);
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

btRigidBody.prototype["setUserIndex"] = btRigidBody.prototype.setUserIndex = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 _emscripten_bind_btRigidBody_setUserIndex_1(self, index);
};

btRigidBody.prototype["__destroy__"] = btRigidBody.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBody___destroy___0(self);
};

function btSequentialImpulseConstraintSolver() {
 this.ptr = _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0();
 getCache(btSequentialImpulseConstraintSolver)[this.ptr] = this;
}

btSequentialImpulseConstraintSolver.prototype = Object.create(btConstraintSolver.prototype);

btSequentialImpulseConstraintSolver.prototype.constructor = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype.__class__ = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.__cache__ = {};

Module["btSequentialImpulseConstraintSolver"] = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype["__destroy__"] = btSequentialImpulseConstraintSolver.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0(self);
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

btKinematicCharacterController.prototype["setJumpSpeed"] = btKinematicCharacterController.prototype.setJumpSpeed = function(jumpSpeed) {
 var self = this.ptr;
 if (jumpSpeed && typeof jumpSpeed === "object") jumpSpeed = jumpSpeed.ptr;
 _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1(self, jumpSpeed);
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

btKinematicCharacterController.prototype["onGround"] = btKinematicCharacterController.prototype.onGround = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_onGround_0(self);
};

btKinematicCharacterController.prototype["setMaxPenetrationDepth"] = btKinematicCharacterController.prototype.setMaxPenetrationDepth = function(d) {
 var self = this.ptr;
 if (d && typeof d === "object") d = d.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1(self, d);
};

btKinematicCharacterController.prototype["setStepHeight"] = btKinematicCharacterController.prototype.setStepHeight = function(h) {
 var self = this.ptr;
 if (h && typeof h === "object") h = h.ptr;
 _emscripten_bind_btKinematicCharacterController_setStepHeight_1(self, h);
};

btKinematicCharacterController.prototype["getVerticalVelocity"] = btKinematicCharacterController.prototype.getVerticalVelocity = function() {
 var self = this.ptr;
 return _emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0(self);
};

btKinematicCharacterController.prototype["isJumping"] = btKinematicCharacterController.prototype.isJumping = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_isJumping_0(self);
};

btKinematicCharacterController.prototype["getFloorUserIndex"] = btKinematicCharacterController.prototype.getFloorUserIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0(self);
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

btPairCachingGhostObject.prototype["isStaticObject"] = btPairCachingGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isStaticObject_0(self);
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

btPairCachingGhostObject.prototype["setUserIndex"] = btPairCachingGhostObject.prototype.setUserIndex = function(index) {
 var self = this.ptr;
 if (index && typeof index === "object") index = index.ptr;
 _emscripten_bind_btPairCachingGhostObject_setUserIndex_1(self, index);
};

btPairCachingGhostObject.prototype["getNumOverlappingObjects"] = btPairCachingGhostObject.prototype.getNumOverlappingObjects = function() {
 var self = this.ptr;
 return _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0(self);
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
