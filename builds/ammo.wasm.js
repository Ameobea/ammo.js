// This is ammo.js, a port of Bullet Physics to JavaScript. zlib licensed.
var Ammo = (() => {
  var _scriptName = typeof document != 'undefined' ? document.currentScript?.src : undefined;
  
  return (
async function(moduleArg = {}) {
  var moduleRtn;

// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Set up the promise that indicates the Module is initialized
var readyPromiseResolve, readyPromiseReject;

var readyPromise = new Promise((resolve, reject) => {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
var ENVIRONMENT_IS_WEB = true;

var ENVIRONMENT_IS_WORKER = false;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {
  ...Module
};

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE, this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptName) {
    scriptDirectory = _scriptName;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith("blob:")) {
    scriptDirectory = "";
  } else {
    scriptDirectory = scriptDirectory.slice(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  }
  {
    // include: web_or_worker_shell_read.js
    readAsync = async url => {
      var response = await fetch(url, {
        credentials: "same-origin"
      });
      if (response.ok) {
        return response.arrayBuffer();
      }
      throw new Error(response.status + " : " + response.url);
    };
  }
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);

// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary = Module["wasmBinary"];

// Wasm globals
var wasmMemory;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    // This build was created without ASSERTIONS defined.  `assert()` should not
    // ever be called in this configuration but in case there are callers in
    // the wild leave this simple abort() implementation here for now.
    abort(text);
  }
}

// Memory management
var /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /* BigInt64Array type is not correctly defined in closure
/** not-@type {!BigInt64Array} */ HEAP64, /* BigUint64Array type is not correctly defined in closure
/** not-t@type {!BigUint64Array} */ HEAPU64, /** @type {!Float64Array} */ HEAPF64;

var runtimeInitialized = false;

// include: runtime_shared.js
// include: runtime_stack_check.js
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
// end include: runtime_debug.js
// include: memoryprofiler.js
// end include: memoryprofiler.js
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
  Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
  Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b);
}

// end include: runtime_shared.js
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(onPreRuns);
}

function initRuntime() {
  runtimeInitialized = true;
  wasmExports["h"]();
}

function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(onPostRuns);
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;

var dependenciesFulfilled = null;

function addRunDependency(id) {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
}

function removeRunDependency(id) {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (runDependencies == 0) {
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

/** @param {string|number=} what */ function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  what += ". Build with -sASSERTIONS for more info.";
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  readyPromiseReject(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile("ammo.wasm.wasm");
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

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {}
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function") {
    try {
      var response = fetch(binaryFile, {
        credentials: "same-origin"
      });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err("falling back to ArrayBuffer instantiation");
    }
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  return {
    "a": wasmImports
  };
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmMemory = wasmExports["g"];
    updateMemoryViews();
    wasmTable = wasmExports["Qc"];
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency("wasm-instantiate");
  // Prefer streaming instantiation if available.
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result["instance"]);
  }
  var info = getWasmImports();
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module["instantiateWasm"]) {
    return new Promise((resolve, reject) => {
      Module["instantiateWasm"](info, (mod, inst) => {
        receiveInstance(mod, inst);
        resolve(mod.exports);
      });
    });
  }
  wasmBinaryFile ??= findWasmBinary();
  try {
    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
  } catch (e) {
    // If instantiation fails, reject the module ready promise.
    readyPromiseReject(e);
    return Promise.reject(e);
  }
}

// end include: preamble.js
// Begin JS library code
class ExitStatus {
  name="ExitStatus";
  constructor(status) {
    this.message = `Program terminated with exit(${status})`;
    this.status = status;
  }
}

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
    callbacks.shift()(Module);
  }
};

var onPostRuns = [];

var addOnPostRun = cb => onPostRuns.unshift(cb);

var onPreRuns = [];

var addOnPreRun = cb => onPreRuns.unshift(cb);

var noExitRuntime = Module["noExitRuntime"] || true;

var __abort_js = () => abort("");

var runtimeKeepaliveCounter = 0;

var __emscripten_runtime_keepalive_clear = () => {
  noExitRuntime = false;
  runtimeKeepaliveCounter = 0;
};

var timers = {};

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  quit_(1, e);
};

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var _proc_exit = code => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};

/** @suppress {duplicate } */ /** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  _proc_exit(status);
};

var _exit = exitJS;

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = func => {
  if (ABORT) {
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
};

var _emscripten_get_now = () => performance.now();

var __setitimer_js = (which, timeout_ms) => {
  // First, clear any existing timer.
  if (timers[which]) {
    clearTimeout(timers[which].id);
    delete timers[which];
  }
  // A timeout of zero simply cancels the current timeout so we have nothing
  // more to do.
  if (!timeout_ms) return 0;
  var id = setTimeout(() => {
    delete timers[which];
    callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
  }, timeout_ms);
  timers[which] = {
    id,
    timeout_ms
  };
  return 0;
};

var getHeapMax = () => // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
// full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
// for any code that deals with heap sizes, which would require special
// casing all heap size related code to treat 0 specially.
2147483648;

var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;

var growMemory = size => {
  var b = wasmMemory.buffer;
  var pages = ((size - b.byteLength + 65535) / 65536) | 0;
  try {
    // round size grow request up to wasm page size (fixed 64KB per spec)
    wasmMemory.grow(pages);
    // .grow() takes a delta compared to the previous size
    updateMemoryViews();
    return 1;
  } catch (e) {}
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = HEAPU8.length;
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
  requestedSize >>>= 0;
  // With multithreaded builds, races can happen (another thread might increase the size
  // in between), so return a failure, and let the caller retry.
  // Memory resize rules:
  // 1.  Always increase heap size to at least the requested size, rounded up
  //     to next page multiple.
  // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
  //     geometrically: increase the heap size according to
  //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
  //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
  // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
  //     linearly: increase the heap size by at least
  //     MEMORY_GROWTH_LINEAR_STEP bytes.
  // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
  //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
  // 4.  If we were unable to allocate as much memory, it may be due to
  //     over-eager decision to excessively reserve due to (3) above.
  //     Hence if an allocation fails, cut down on the amount of excess
  //     growth, in an attempt to succeed to perform a smaller allocation.
  // A limit is set for how much we can grow. We should not exceed that
  // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  // Loop through potential heap size increases. If we attempt a too eager
  // reservation that fails, cut down on the attempted size and reserve a
  // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
    // ensure geometric growth
    // but limit overreserving (default to capping at +96MB overgrowth at most)
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
};

var printCharBuffers = [ null, [], [] ];

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined/NaN means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

var printChar = (stream, curr) => {
  var buffer = printCharBuffers[stream];
  if (curr === 0 || curr === 10) {
    (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";

var _fd_write = (fd, iov, iovcnt, pnum) => {
  // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
  var num = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[((iov) >> 2)];
    var len = HEAPU32[(((iov) + (4)) >> 2)];
    iov += 8;
    for (var j = 0; j < len; j++) {
      printChar(fd, HEAPU8[ptr + j]);
    }
    num += len;
  }
  HEAPU32[((pnum) >> 2)] = num;
  return 0;
};

var uleb128Encode = (n, target) => {
  if (n < 128) {
    target.push(n);
  } else {
    target.push((n % 128) | 128, n >> 7);
  }
};

var sigToWasmTypes = sig => {
  var typeNames = {
    "i": "i32",
    "j": "i64",
    "f": "f32",
    "d": "f64",
    "e": "externref",
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
    // i32
    "p": 127,
    // i32
    "j": 126,
    // i64
    "f": 125,
    // f32
    "d": 124,
    // f64
    "e": 111
  };
  // Parameters, length + signatures
  target.push(96);
  uleb128Encode(sigParam.length, target);
  for (var paramType of sigParam) {
    target.push(typeCodes[paramType]);
  }
  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == "v") {
    target.push(0);
  } else {
    target.push(1, typeCodes[sigRet]);
  }
};

var convertJsFunctionToWasm = (func, sig) => {
  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function == "function") {
    return new WebAssembly.Function(sigToWasmTypes(sig), func);
  }
  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSectionBody = [ 1 ];
  generateFuncType(sig, typeSectionBody);
  // Rest of the module is static
  var bytes = [ 0, 97, 115, 109, // magic ("\0asm")
  1, 0, 0, 0, // version: 1
  1 ];
  // Write the overall length of the type section followed by the body
  uleb128Encode(typeSectionBody.length, bytes);
  bytes.push(...typeSectionBody);
  // The rest of the module is static
  bytes.push(2, 7, // import section
  // (import "e" "f" (func 0 (type 0)))
  1, 1, 101, 1, 102, 0, 0, 7, 5, // export section
  // (export "f" (func 0 (type 0)))
  1, 1, 102, 0, 0);
  // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
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

/** @type {WebAssembly.Table} */ var wasmTable;

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    /** @suppress {checkTypes} */ wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  return func;
};

var updateTableMap = (offset, count) => {
  if (functionsInTableMap) {
    for (var i = offset; i < offset + count; i++) {
      var item = getWasmTableEntry(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
};

var functionsInTableMap;

var getFunctionAddress = func => {
  // First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap;
    updateTableMap(0, wasmTable.length);
  }
  return functionsInTableMap.get(func) || 0;
};

var freeTableIndexes = [];

var getEmptyTableSlot = () => {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  // Grow the table
  try {
    /** @suppress {checkTypes} */ wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
  }
  return wasmTable.length - 1;
};

var setWasmTableEntry = (idx, func) => {
  /** @suppress {checkTypes} */ wasmTable.set(idx, func);
  // With ABORT_ON_WASM_EXCEPTIONS wasmTable.get is overridden to return wrapped
  // functions so we need to call it here to retrieve the potential wrapper correctly
  // instead of just storing 'func' directly into wasmTableMirror
  /** @suppress {checkTypes} */ wasmTableMirror[idx] = wasmTable.get(idx);
};

/** @param {string=} sig */ var addFunction = (func, sig) => {
  // Check if the function is already in the table, to ensure each function
  // gets a unique index.
  var rtn = getFunctionAddress(func);
  if (rtn) {
    return rtn;
  }
  // It's not in the table, add it now.
  var ret = getEmptyTableSlot();
  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
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

// End JS library code
var wasmImports = {
  /** @export */ d: __abort_js,
  /** @export */ c: __emscripten_runtime_keepalive_clear,
  /** @export */ b: __setitimer_js,
  /** @export */ a: _emscripten_resize_heap,
  /** @export */ f: _fd_write,
  /** @export */ e: _proc_exit
};

var wasmExports = await createWasm();

var ___wasm_call_ctors = wasmExports["h"];

var _webidl_free = Module["_webidl_free"] = wasmExports["i"];

var _free = Module["_free"] = wasmExports["j"];

var _webidl_malloc = Module["_webidl_malloc"] = wasmExports["k"];

var _malloc = Module["_malloc"] = wasmExports["l"];

var _emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = wasmExports["m"];

var _emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = wasmExports["n"];

var _emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = wasmExports["o"];

var _emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = wasmExports["p"];

var _emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = wasmExports["q"];

var _emscripten_bind_btCollisionObject_setUserIndex_1 = Module["_emscripten_bind_btCollisionObject_setUserIndex_1"] = wasmExports["r"];

var _emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = wasmExports["s"];

var _emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = wasmExports["t"];

var _emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = wasmExports["u"];

var _emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = wasmExports["v"];

var _emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = wasmExports["w"];

var _emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = wasmExports["x"];

var _emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = wasmExports["y"];

var _emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = wasmExports["z"];

var _emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = wasmExports["A"];

var _emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = wasmExports["B"];

var _emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = wasmExports["C"];

var _emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = wasmExports["D"];

var _emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = wasmExports["E"];

var _emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = wasmExports["F"];

var _emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = wasmExports["G"];

var _emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = wasmExports["H"];

var _emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = wasmExports["I"];

var _emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = wasmExports["J"];

var _emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = wasmExports["K"];

var _emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = wasmExports["L"];

var _emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = wasmExports["M"];

var _emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = wasmExports["N"];

var _emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = wasmExports["O"];

var _emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = wasmExports["P"];

var _emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = wasmExports["Q"];

var _emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = wasmExports["R"];

var _emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = wasmExports["S"];

var _emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = wasmExports["T"];

var _emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = wasmExports["U"];

var _emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = wasmExports["V"];

var _emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = wasmExports["W"];

var _emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = wasmExports["X"];

var _emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = wasmExports["Y"];

var _emscripten_bind_btGhostObject_setUserIndex_1 = Module["_emscripten_bind_btGhostObject_setUserIndex_1"] = wasmExports["Z"];

var _emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = wasmExports["_"];

var _emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = wasmExports["$"];

var _emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = wasmExports["aa"];

var _emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = wasmExports["ba"];

var _emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = wasmExports["ca"];

var _emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = wasmExports["da"];

var _emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = wasmExports["ea"];

var _emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = wasmExports["fa"];

var _emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = wasmExports["ga"];

var _emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = wasmExports["ha"];

var _emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = wasmExports["ia"];

var _emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = wasmExports["ja"];

var _emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = wasmExports["ka"];

var _emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = wasmExports["la"];

var _emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = wasmExports["ma"];

var _emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = wasmExports["na"];

var _emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = wasmExports["oa"];

var _emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = wasmExports["pa"];

var _emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = wasmExports["qa"];

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = wasmExports["ra"];

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = wasmExports["sa"];

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = wasmExports["ta"];

var _emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = wasmExports["ua"];

var _emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = wasmExports["va"];

var _emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = wasmExports["wa"];

var _emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = wasmExports["xa"];

var _emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = wasmExports["ya"];

var _emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = wasmExports["za"];

var _emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = wasmExports["Aa"];

var _emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = wasmExports["Ba"];

var _emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = wasmExports["Ca"];

var _emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = wasmExports["Da"];

var _emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = wasmExports["Ea"];

var _emscripten_bind_btConeShape_btConeShape_2 = Module["_emscripten_bind_btConeShape_btConeShape_2"] = wasmExports["Fa"];

var _emscripten_bind_btConeShape_setLocalScaling_1 = Module["_emscripten_bind_btConeShape_setLocalScaling_1"] = wasmExports["Ga"];

var _emscripten_bind_btConeShape___destroy___0 = Module["_emscripten_bind_btConeShape___destroy___0"] = wasmExports["Ha"];

var _emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = wasmExports["Ia"];

var _emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = wasmExports["Ja"];

var _emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = wasmExports["Ka"];

var _emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = wasmExports["La"];

var _emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = wasmExports["Ma"];

var _emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = wasmExports["Na"];

var _emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = wasmExports["Oa"];

var _emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = wasmExports["Pa"];

var _emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = wasmExports["Qa"];

var _emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = wasmExports["Ra"];

var _emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = wasmExports["Sa"];

var _emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = wasmExports["Ta"];

var _emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = wasmExports["Ua"];

var _emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = wasmExports["Va"];

var _emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = wasmExports["Wa"];

var _emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = wasmExports["Xa"];

var _emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = wasmExports["Ya"];

var _emscripten_bind_btTriangleMesh_preallocateIndices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateIndices_1"] = wasmExports["Za"];

var _emscripten_bind_btTriangleMesh_preallocateVertices_1 = Module["_emscripten_bind_btTriangleMesh_preallocateVertices_1"] = wasmExports["_a"];

var _emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = wasmExports["$a"];

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = wasmExports["ab"];

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = wasmExports["bb"];

var _emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = wasmExports["cb"];

var _emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9 = Module["_emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9"] = wasmExports["db"];

var _emscripten_bind_btHeightfieldTerrainShape_setMargin_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setMargin_1"] = wasmExports["eb"];

var _emscripten_bind_btHeightfieldTerrainShape_getMargin_0 = Module["_emscripten_bind_btHeightfieldTerrainShape_getMargin_0"] = wasmExports["fb"];

var _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1"] = wasmExports["gb"];

var _emscripten_bind_btHeightfieldTerrainShape___destroy___0 = Module["_emscripten_bind_btHeightfieldTerrainShape___destroy___0"] = wasmExports["hb"];

var _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = wasmExports["ib"];

var _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = wasmExports["jb"];

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = wasmExports["kb"];

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = wasmExports["lb"];

var _emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = wasmExports["mb"];

var _emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = wasmExports["nb"];

var _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = wasmExports["ob"];

var _emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = wasmExports["pb"];

var _emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = wasmExports["qb"];

var _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = wasmExports["rb"];

var _emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = wasmExports["sb"];

var _emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0 = Module["_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0"] = wasmExports["tb"];

var _emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = wasmExports["ub"];

var _emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = wasmExports["vb"];

var _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = wasmExports["wb"];

var _emscripten_bind_btDbvtBroadphase_optimize_0 = Module["_emscripten_bind_btDbvtBroadphase_optimize_0"] = wasmExports["xb"];

var _emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = wasmExports["yb"];

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = wasmExports["zb"];

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = wasmExports["Ab"];

var _emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = wasmExports["Bb"];

var _emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = wasmExports["Cb"];

var _emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = wasmExports["Db"];

var _emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = wasmExports["Eb"];

var _emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = wasmExports["Fb"];

var _emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = wasmExports["Gb"];

var _emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = wasmExports["Hb"];

var _emscripten_bind_btRigidBody_setUserIndex_1 = Module["_emscripten_bind_btRigidBody_setUserIndex_1"] = wasmExports["Ib"];

var _emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = wasmExports["Jb"];

var _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = wasmExports["Kb"];

var _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = wasmExports["Lb"];

var _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = wasmExports["Mb"];

var _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = wasmExports["Nb"];

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = wasmExports["Ob"];

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = wasmExports["Pb"];

var _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = wasmExports["Qb"];

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = wasmExports["Rb"];

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = wasmExports["Sb"];

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = wasmExports["Tb"];

var _emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = wasmExports["Ub"];

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = wasmExports["Vb"];

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = wasmExports["Wb"];

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = wasmExports["Xb"];

var _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = wasmExports["Yb"];

var _emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = wasmExports["Zb"];

var _emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = wasmExports["_b"];

var _emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = wasmExports["$b"];

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = wasmExports["ac"];

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = wasmExports["bc"];

var _emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = wasmExports["cc"];

var _emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = wasmExports["dc"];

var _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = wasmExports["ec"];

var _emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = wasmExports["fc"];

var _emscripten_bind_btKinematicCharacterController_jump_1 = Module["_emscripten_bind_btKinematicCharacterController_jump_1"] = wasmExports["gc"];

var _emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = wasmExports["hc"];

var _emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = wasmExports["ic"];

var _emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = wasmExports["jc"];

var _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1"] = wasmExports["kc"];

var _emscripten_bind_btKinematicCharacterController_setStepHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setStepHeight_1"] = wasmExports["lc"];

var _emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0 = Module["_emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0"] = wasmExports["mc"];

var _emscripten_bind_btKinematicCharacterController_setVerticalVelocity_1 = Module["_emscripten_bind_btKinematicCharacterController_setVerticalVelocity_1"] = wasmExports["nc"];

var _emscripten_bind_btKinematicCharacterController_resetFall_0 = Module["_emscripten_bind_btKinematicCharacterController_resetFall_0"] = wasmExports["oc"];

var _emscripten_bind_btKinematicCharacterController_getVerticalOffset_0 = Module["_emscripten_bind_btKinematicCharacterController_getVerticalOffset_0"] = wasmExports["pc"];

var _emscripten_bind_btKinematicCharacterController_getJumpAxis_0 = Module["_emscripten_bind_btKinematicCharacterController_getJumpAxis_0"] = wasmExports["qc"];

var _emscripten_bind_btKinematicCharacterController_addExternalVelocity_1 = Module["_emscripten_bind_btKinematicCharacterController_addExternalVelocity_1"] = wasmExports["rc"];

var _emscripten_bind_btKinematicCharacterController_setExternalVelocity_1 = Module["_emscripten_bind_btKinematicCharacterController_setExternalVelocity_1"] = wasmExports["sc"];

var _emscripten_bind_btKinematicCharacterController_setExternalVelocityAirDampingFactor_1 = Module["_emscripten_bind_btKinematicCharacterController_setExternalVelocityAirDampingFactor_1"] = wasmExports["tc"];

var _emscripten_bind_btKinematicCharacterController_setExternalVelocityGroundDampingFactor_1 = Module["_emscripten_bind_btKinematicCharacterController_setExternalVelocityGroundDampingFactor_1"] = wasmExports["uc"];

var _emscripten_bind_btKinematicCharacterController_getExternalVelocity_0 = Module["_emscripten_bind_btKinematicCharacterController_getExternalVelocity_0"] = wasmExports["vc"];

var _emscripten_bind_btKinematicCharacterController_isJumping_0 = Module["_emscripten_bind_btKinematicCharacterController_isJumping_0"] = wasmExports["wc"];

var _emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0 = Module["_emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0"] = wasmExports["xc"];

var _emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = wasmExports["yc"];

var _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = wasmExports["zc"];

var _emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = wasmExports["Ac"];

var _emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = wasmExports["Bc"];

var _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = wasmExports["Cc"];

var _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = wasmExports["Dc"];

var _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = wasmExports["Ec"];

var _emscripten_bind_btPairCachingGhostObject_setUserIndex_1 = Module["_emscripten_bind_btPairCachingGhostObject_setUserIndex_1"] = wasmExports["Fc"];

var _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = wasmExports["Gc"];

var _emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = wasmExports["Hc"];

var _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = wasmExports["Ic"];

var _emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = wasmExports["Jc"];

var _emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = wasmExports["Kc"];

var _emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = wasmExports["Lc"];

var _emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = wasmExports["Mc"];

var _emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = wasmExports["Nc"];

var _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = wasmExports["Oc"];

var _emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = wasmExports["Pc"];

var __emscripten_timeout = wasmExports["Rc"];

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
Module["addFunction"] = addFunction;

Module["UTF8ToString"] = UTF8ToString;

function run() {
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  preRun();
  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }
  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    readyPromiseResolve(Module);
    Module["onRuntimeInitialized"]?.();
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(() => {
      setTimeout(() => Module["setStatus"](""), 1);
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

// end include: postamble.js
// include: glue.js
// Bindings utilities
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function WrapperObject() {}

WrapperObject.prototype = Object.create(WrapperObject.prototype);

WrapperObject.prototype.constructor = WrapperObject;

WrapperObject.prototype.__class__ = WrapperObject;

WrapperObject.__cache__ = {};

Module["WrapperObject"] = WrapperObject;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */ function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}

Module["getCache"] = getCache;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant)
    @param {*=} __class__ */ function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__);
  var ret = cache[ptr];
  if (ret) return ret;
  ret = Object.create((__class__ || WrapperObject).prototype);
  ret.ptr = ptr;
  return cache[ptr] = ret;
}

Module["wrapPointer"] = wrapPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}

Module["castObject"] = castObject;

Module["NULL"] = wrapPointer(0);

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function destroy(obj) {
  if (!obj["__destroy__"]) throw "Error: Cannot destroy object. (Did you create it yourself?)";
  obj["__destroy__"]();
  // Remove from cache, so the object can be GC'd and refs added onto it released
  delete getCache(obj.__class__)[obj.ptr];
}

Module["destroy"] = destroy;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}

Module["compare"] = compare;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function getPointer(obj) {
  return obj.ptr;
}

Module["getPointer"] = getPointer;

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function getClass(obj) {
  return obj.__class__;
}

Module["getClass"] = getClass;

// Converts big (string or array) values into a C-style storage, in temporary space
/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ var ensureCache = {
  buffer: 0,
  // the main buffer of temporary storage
  size: 0,
  // the size of buffer
  pos: 0,
  // the next free offset in buffer
  temps: [],
  // extra allocations
  needed: 0,
  // the total size we need next time
  prepare() {
    if (ensureCache.needed) {
      // clear the temps
      for (var i = 0; i < ensureCache.temps.length; i++) {
        Module["_webidl_free"](ensureCache.temps[i]);
      }
      ensureCache.temps.length = 0;
      // prepare to allocate a bigger buffer
      Module["_webidl_free"](ensureCache.buffer);
      ensureCache.buffer = 0;
      ensureCache.size += ensureCache.needed;
      // clean up
      ensureCache.needed = 0;
    }
    if (!ensureCache.buffer) {
      // happens first time, or when we need to grow
      ensureCache.size += 128;
      // heuristic, avoid many small grow events
      ensureCache.buffer = Module["_webidl_malloc"](ensureCache.size);
      assert(ensureCache.buffer);
    }
    ensureCache.pos = 0;
  },
  alloc(array, view) {
    assert(ensureCache.buffer);
    var bytes = view.BYTES_PER_ELEMENT;
    var len = array.length * bytes;
    len = (len + 7) & -8;
    // keep things aligned to 8 byte boundaries
    var ret;
    if (ensureCache.pos + len >= ensureCache.size) {
      // we failed to allocate in the buffer, ensureCache time around :(
      assert(len > 0);
      // null terminator, at least
      ensureCache.needed += len;
      ret = Module["_webidl_malloc"](len);
      ensureCache.temps.push(ret);
    } else {
      // we can allocate in the buffer
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

/** @suppress {duplicate} (TODO: avoid emitting this multiple times, it is redundant) */ function ensureFloat32(value) {
  if (typeof value === "object") {
    var offset = ensureCache.alloc(value, HEAPF32);
    ensureCache.copy(value, HEAPF32, offset);
    return offset;
  }
  return value;
}

// btCollisionObject
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCollisionObject() {
  throw "cannot construct a btCollisionObject, no constructor in IDL";
}

btCollisionObject.prototype = Object.create(WrapperObject.prototype);

btCollisionObject.prototype.constructor = btCollisionObject;

btCollisionObject.prototype.__class__ = btCollisionObject;

btCollisionObject.__cache__ = {};

Module["btCollisionObject"] = btCollisionObject;

btCollisionObject.prototype["isStaticObject"] = btCollisionObject.prototype.isStaticObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btCollisionObject_isStaticObject_0(self));
};

btCollisionObject.prototype["getWorldTransform"] = btCollisionObject.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btCollisionObject_getWorldTransform_0(self), btTransform);
};

btCollisionObject.prototype["setCollisionFlags"] = btCollisionObject.prototype.setCollisionFlags = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(flags) {
  var self = this.ptr;
  if (flags && typeof flags === "object") flags = flags.ptr;
  _emscripten_bind_btCollisionObject_setCollisionFlags_1(self, flags);
};

btCollisionObject.prototype["setWorldTransform"] = btCollisionObject.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btCollisionObject_setWorldTransform_1(self, worldTrans);
};

btCollisionObject.prototype["setCollisionShape"] = btCollisionObject.prototype.setCollisionShape = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionShape) {
  var self = this.ptr;
  if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
  _emscripten_bind_btCollisionObject_setCollisionShape_1(self, collisionShape);
};

btCollisionObject.prototype["setUserIndex"] = btCollisionObject.prototype.setUserIndex = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(index) {
  var self = this.ptr;
  if (index && typeof index === "object") index = index.ptr;
  _emscripten_bind_btCollisionObject_setUserIndex_1(self, index);
};

btCollisionObject.prototype["__destroy__"] = btCollisionObject.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCollisionObject___destroy___0(self);
};

// btCollisionShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCollisionShape() {
  throw "cannot construct a btCollisionShape, no constructor in IDL";
}

btCollisionShape.prototype = Object.create(WrapperObject.prototype);

btCollisionShape.prototype.constructor = btCollisionShape;

btCollisionShape.prototype.__class__ = btCollisionShape;

btCollisionShape.__cache__ = {};

Module["btCollisionShape"] = btCollisionShape;

btCollisionShape.prototype["setLocalScaling"] = btCollisionShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btCollisionShape_setLocalScaling_1(self, scaling);
};

btCollisionShape.prototype["__destroy__"] = btCollisionShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCollisionShape___destroy___0(self);
};

// btCollisionWorld
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCollisionWorld() {
  throw "cannot construct a btCollisionWorld, no constructor in IDL";
}

btCollisionWorld.prototype = Object.create(WrapperObject.prototype);

btCollisionWorld.prototype.constructor = btCollisionWorld;

btCollisionWorld.prototype.__class__ = btCollisionWorld;

btCollisionWorld.__cache__ = {};

Module["btCollisionWorld"] = btCollisionWorld;

btCollisionWorld.prototype["getDispatcher"] = btCollisionWorld.prototype.getDispatcher = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btCollisionWorld_getDispatcher_0(self), btDispatcher);
};

btCollisionWorld.prototype["addCollisionObject"] = btCollisionWorld.prototype.addCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject, collisionFilterGroup, collisionFilterMask) {
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

btCollisionWorld.prototype["removeCollisionObject"] = btCollisionWorld.prototype.removeCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject) {
  var self = this.ptr;
  if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
  _emscripten_bind_btCollisionWorld_removeCollisionObject_1(self, collisionObject);
};

btCollisionWorld.prototype["getBroadphase"] = btCollisionWorld.prototype.getBroadphase = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btCollisionWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btCollisionWorld.prototype["__destroy__"] = btCollisionWorld.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCollisionWorld___destroy___0(self);
};

// btMotionState
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btMotionState() {
  throw "cannot construct a btMotionState, no constructor in IDL";
}

btMotionState.prototype = Object.create(WrapperObject.prototype);

btMotionState.prototype.constructor = btMotionState;

btMotionState.prototype.__class__ = btMotionState;

btMotionState.__cache__ = {};

Module["btMotionState"] = btMotionState;

btMotionState.prototype["getWorldTransform"] = btMotionState.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btMotionState_getWorldTransform_1(self, worldTrans);
};

btMotionState.prototype["setWorldTransform"] = btMotionState.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btMotionState_setWorldTransform_1(self, worldTrans);
};

btMotionState.prototype["__destroy__"] = btMotionState.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btMotionState___destroy___0(self);
};

// btStridingMeshInterface
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btStridingMeshInterface() {
  throw "cannot construct a btStridingMeshInterface, no constructor in IDL";
}

btStridingMeshInterface.prototype = Object.create(WrapperObject.prototype);

btStridingMeshInterface.prototype.constructor = btStridingMeshInterface;

btStridingMeshInterface.prototype.__class__ = btStridingMeshInterface;

btStridingMeshInterface.__cache__ = {};

Module["btStridingMeshInterface"] = btStridingMeshInterface;

btStridingMeshInterface.prototype["__destroy__"] = btStridingMeshInterface.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btStridingMeshInterface___destroy___0(self);
};

// btConcaveShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btConcaveShape() {
  throw "cannot construct a btConcaveShape, no constructor in IDL";
}

btConcaveShape.prototype = Object.create(btCollisionShape.prototype);

btConcaveShape.prototype.constructor = btConcaveShape;

btConcaveShape.prototype.__class__ = btConcaveShape;

btConcaveShape.__cache__ = {};

Module["btConcaveShape"] = btConcaveShape;

btConcaveShape.prototype["setLocalScaling"] = btConcaveShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btConcaveShape_setLocalScaling_1(self, scaling);
};

btConcaveShape.prototype["__destroy__"] = btConcaveShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btConcaveShape___destroy___0(self);
};

// btConstraintSolver
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btConstraintSolver() {
  throw "cannot construct a btConstraintSolver, no constructor in IDL";
}

btConstraintSolver.prototype = Object.create(WrapperObject.prototype);

btConstraintSolver.prototype.constructor = btConstraintSolver;

btConstraintSolver.prototype.__class__ = btConstraintSolver;

btConstraintSolver.__cache__ = {};

Module["btConstraintSolver"] = btConstraintSolver;

btConstraintSolver.prototype["__destroy__"] = btConstraintSolver.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btConstraintSolver___destroy___0(self);
};

// btDynamicsWorld
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDynamicsWorld() {
  throw "cannot construct a btDynamicsWorld, no constructor in IDL";
}

btDynamicsWorld.prototype = Object.create(btCollisionWorld.prototype);

btDynamicsWorld.prototype.constructor = btDynamicsWorld;

btDynamicsWorld.prototype.__class__ = btDynamicsWorld;

btDynamicsWorld.__cache__ = {};

Module["btDynamicsWorld"] = btDynamicsWorld;

btDynamicsWorld.prototype["addAction"] = btDynamicsWorld.prototype.addAction = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(action) {
  var self = this.ptr;
  if (action && typeof action === "object") action = action.ptr;
  _emscripten_bind_btDynamicsWorld_addAction_1(self, action);
};

btDynamicsWorld.prototype["getDispatcher"] = btDynamicsWorld.prototype.getDispatcher = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDynamicsWorld.prototype["addCollisionObject"] = btDynamicsWorld.prototype.addCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject, collisionFilterGroup, collisionFilterMask) {
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

btDynamicsWorld.prototype["removeCollisionObject"] = btDynamicsWorld.prototype.removeCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject) {
  var self = this.ptr;
  if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
  _emscripten_bind_btDynamicsWorld_removeCollisionObject_1(self, collisionObject);
};

btDynamicsWorld.prototype["getBroadphase"] = btDynamicsWorld.prototype.getBroadphase = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDynamicsWorld.prototype["__destroy__"] = btDynamicsWorld.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDynamicsWorld___destroy___0(self);
};

// btActionInterface
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btActionInterface() {
  throw "cannot construct a btActionInterface, no constructor in IDL";
}

btActionInterface.prototype = Object.create(WrapperObject.prototype);

btActionInterface.prototype.constructor = btActionInterface;

btActionInterface.prototype.__class__ = btActionInterface;

btActionInterface.__cache__ = {};

Module["btActionInterface"] = btActionInterface;

btActionInterface.prototype["__destroy__"] = btActionInterface.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btActionInterface___destroy___0(self);
};

// btGhostObject
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btGhostObject() {
  this.ptr = _emscripten_bind_btGhostObject_btGhostObject_0();
  getCache(btGhostObject)[this.ptr] = this;
}

btGhostObject.prototype = Object.create(btCollisionObject.prototype);

btGhostObject.prototype.constructor = btGhostObject;

btGhostObject.prototype.__class__ = btGhostObject;

btGhostObject.__cache__ = {};

Module["btGhostObject"] = btGhostObject;

btGhostObject.prototype["getNumOverlappingObjects"] = btGhostObject.prototype.getNumOverlappingObjects = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btGhostObject_getNumOverlappingObjects_0(self);
};

btGhostObject.prototype["isStaticObject"] = btGhostObject.prototype.isStaticObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btGhostObject_isStaticObject_0(self));
};

btGhostObject.prototype["getWorldTransform"] = btGhostObject.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btGhostObject_getWorldTransform_0(self), btTransform);
};

btGhostObject.prototype["setCollisionFlags"] = btGhostObject.prototype.setCollisionFlags = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(flags) {
  var self = this.ptr;
  if (flags && typeof flags === "object") flags = flags.ptr;
  _emscripten_bind_btGhostObject_setCollisionFlags_1(self, flags);
};

btGhostObject.prototype["setWorldTransform"] = btGhostObject.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btGhostObject_setWorldTransform_1(self, worldTrans);
};

btGhostObject.prototype["setCollisionShape"] = btGhostObject.prototype.setCollisionShape = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionShape) {
  var self = this.ptr;
  if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
  _emscripten_bind_btGhostObject_setCollisionShape_1(self, collisionShape);
};

btGhostObject.prototype["setUserIndex"] = btGhostObject.prototype.setUserIndex = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(index) {
  var self = this.ptr;
  if (index && typeof index === "object") index = index.ptr;
  _emscripten_bind_btGhostObject_setUserIndex_1(self, index);
};

btGhostObject.prototype["__destroy__"] = btGhostObject.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btGhostObject___destroy___0(self);
};

// VoidPtr
/** @suppress {undefinedVars, duplicate} @this{Object} */ function VoidPtr() {
  throw "cannot construct a VoidPtr, no constructor in IDL";
}

VoidPtr.prototype = Object.create(WrapperObject.prototype);

VoidPtr.prototype.constructor = VoidPtr;

VoidPtr.prototype.__class__ = VoidPtr;

VoidPtr.__cache__ = {};

Module["VoidPtr"] = VoidPtr;

VoidPtr.prototype["__destroy__"] = VoidPtr.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_VoidPtr___destroy___0(self);
};

// btVector3
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btVector3(x, y, z) {
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

btVector3.prototype["length"] = btVector3.prototype.length = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btVector3_length_0(self);
};

btVector3.prototype["x"] = btVector3.prototype.x = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btVector3_x_0(self);
};

btVector3.prototype["y"] = btVector3.prototype.y = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btVector3_y_0(self);
};

btVector3.prototype["z"] = btVector3.prototype.z = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btVector3_z_0(self);
};

btVector3.prototype["setValue"] = btVector3.prototype.setValue = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(x, y, z) {
  var self = this.ptr;
  if (x && typeof x === "object") x = x.ptr;
  if (y && typeof y === "object") y = y.ptr;
  if (z && typeof z === "object") z = z.ptr;
  _emscripten_bind_btVector3_setValue_3(self, x, y, z);
};

btVector3.prototype["__destroy__"] = btVector3.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btVector3___destroy___0(self);
};

// btQuaternion
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btQuaternion(x, y, z, w) {
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

btQuaternion.prototype["__destroy__"] = btQuaternion.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btQuaternion___destroy___0(self);
};

// btTransform
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btTransform(q, v) {
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

btTransform.prototype["setIdentity"] = btTransform.prototype.setIdentity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btTransform_setIdentity_0(self);
};

btTransform.prototype["setOrigin"] = btTransform.prototype.setOrigin = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(origin) {
  var self = this.ptr;
  if (origin && typeof origin === "object") origin = origin.ptr;
  _emscripten_bind_btTransform_setOrigin_1(self, origin);
};

btTransform.prototype["setRotation"] = btTransform.prototype.setRotation = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(rotation) {
  var self = this.ptr;
  if (rotation && typeof rotation === "object") rotation = rotation.ptr;
  _emscripten_bind_btTransform_setRotation_1(self, rotation);
};

btTransform.prototype["getOrigin"] = btTransform.prototype.getOrigin = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btTransform_getOrigin_0(self), btVector3);
};

btTransform.prototype["__destroy__"] = btTransform.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btTransform___destroy___0(self);
};

// btDefaultMotionState
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDefaultMotionState(startTrans, centerOfMassOffset) {
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

btDefaultMotionState.prototype["getWorldTransform"] = btDefaultMotionState.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btDefaultMotionState_getWorldTransform_1(self, worldTrans);
};

btDefaultMotionState.prototype["setWorldTransform"] = btDefaultMotionState.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btDefaultMotionState_setWorldTransform_1(self, worldTrans);
};

btDefaultMotionState.prototype["__destroy__"] = btDefaultMotionState.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDefaultMotionState___destroy___0(self);
};

// btConvexShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btConvexShape() {
  throw "cannot construct a btConvexShape, no constructor in IDL";
}

btConvexShape.prototype = Object.create(btCollisionShape.prototype);

btConvexShape.prototype.constructor = btConvexShape;

btConvexShape.prototype.__class__ = btConvexShape;

btConvexShape.__cache__ = {};

Module["btConvexShape"] = btConvexShape;

btConvexShape.prototype["setLocalScaling"] = btConvexShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btConvexShape_setLocalScaling_1(self, scaling);
};

btConvexShape.prototype["__destroy__"] = btConvexShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btConvexShape___destroy___0(self);
};

// btBoxShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btBoxShape(boxHalfExtents) {
  if (boxHalfExtents && typeof boxHalfExtents === "object") boxHalfExtents = boxHalfExtents.ptr;
  this.ptr = _emscripten_bind_btBoxShape_btBoxShape_1(boxHalfExtents);
  getCache(btBoxShape)[this.ptr] = this;
}

btBoxShape.prototype = Object.create(btCollisionShape.prototype);

btBoxShape.prototype.constructor = btBoxShape;

btBoxShape.prototype.__class__ = btBoxShape;

btBoxShape.__cache__ = {};

Module["btBoxShape"] = btBoxShape;

btBoxShape.prototype["setLocalScaling"] = btBoxShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btBoxShape_setLocalScaling_1(self, scaling);
};

btBoxShape.prototype["__destroy__"] = btBoxShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btBoxShape___destroy___0(self);
};

// btCapsuleShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCapsuleShape(radius, height) {
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

btCapsuleShape.prototype["setLocalScaling"] = btCapsuleShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btCapsuleShape_setLocalScaling_1(self, scaling);
};

btCapsuleShape.prototype["__destroy__"] = btCapsuleShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCapsuleShape___destroy___0(self);
};

// btConeShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btConeShape(radius, height) {
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

btConeShape.prototype["setLocalScaling"] = btConeShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btConeShape_setLocalScaling_1(self, scaling);
};

btConeShape.prototype["__destroy__"] = btConeShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btConeShape___destroy___0(self);
};

// btConvexHullShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btConvexHullShape(points, numPoints) {
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

btConvexHullShape.prototype["addPoint"] = btConvexHullShape.prototype.addPoint = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(point, recalculateLocalAABB) {
  var self = this.ptr;
  if (point && typeof point === "object") point = point.ptr;
  if (recalculateLocalAABB && typeof recalculateLocalAABB === "object") recalculateLocalAABB = recalculateLocalAABB.ptr;
  if (recalculateLocalAABB === undefined) {
    _emscripten_bind_btConvexHullShape_addPoint_1(self, point);
    return;
  }
  _emscripten_bind_btConvexHullShape_addPoint_2(self, point, recalculateLocalAABB);
};

btConvexHullShape.prototype["setLocalScaling"] = btConvexHullShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btConvexHullShape_setLocalScaling_1(self, scaling);
};

btConvexHullShape.prototype["__destroy__"] = btConvexHullShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btConvexHullShape___destroy___0(self);
};

// btCompoundShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCompoundShape(enableDynamicAabbTree) {
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

btCompoundShape.prototype["addChildShape"] = btCompoundShape.prototype.addChildShape = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(localTransform, shape) {
  var self = this.ptr;
  if (localTransform && typeof localTransform === "object") localTransform = localTransform.ptr;
  if (shape && typeof shape === "object") shape = shape.ptr;
  _emscripten_bind_btCompoundShape_addChildShape_2(self, localTransform, shape);
};

btCompoundShape.prototype["setLocalScaling"] = btCompoundShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btCompoundShape_setLocalScaling_1(self, scaling);
};

btCompoundShape.prototype["__destroy__"] = btCompoundShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCompoundShape___destroy___0(self);
};

// btTriangleMesh
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btTriangleMesh(use32bitIndices, use4componentVertices) {
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

btTriangleMesh.prototype["addTriangle"] = btTriangleMesh.prototype.addTriangle = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(vertex0, vertex1, vertex2, removeDuplicateVertices) {
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

btTriangleMesh.prototype["preallocateIndices"] = btTriangleMesh.prototype.preallocateIndices = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(numindices) {
  var self = this.ptr;
  if (numindices && typeof numindices === "object") numindices = numindices.ptr;
  _emscripten_bind_btTriangleMesh_preallocateIndices_1(self, numindices);
};

btTriangleMesh.prototype["preallocateVertices"] = btTriangleMesh.prototype.preallocateVertices = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(numverts) {
  var self = this.ptr;
  if (numverts && typeof numverts === "object") numverts = numverts.ptr;
  _emscripten_bind_btTriangleMesh_preallocateVertices_1(self, numverts);
};

btTriangleMesh.prototype["__destroy__"] = btTriangleMesh.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btTriangleMesh___destroy___0(self);
};

// btBvhTriangleMeshShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btBvhTriangleMeshShape(meshInterface, useQuantizedAabbCompression, buildBvh) {
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

btBvhTriangleMeshShape.prototype["__destroy__"] = btBvhTriangleMeshShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btBvhTriangleMeshShape___destroy___0(self);
};

// btHeightfieldTerrainShape
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btHeightfieldTerrainShape(heightStickWidth, heightStickLength, heightfieldData, heightScale, minHeight, maxHeight, upAxis, hdt, flipQuadEdges) {
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

btHeightfieldTerrainShape.prototype["setMargin"] = btHeightfieldTerrainShape.prototype.setMargin = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(margin) {
  var self = this.ptr;
  if (margin && typeof margin === "object") margin = margin.ptr;
  _emscripten_bind_btHeightfieldTerrainShape_setMargin_1(self, margin);
};

btHeightfieldTerrainShape.prototype["getMargin"] = btHeightfieldTerrainShape.prototype.getMargin = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btHeightfieldTerrainShape_getMargin_0(self);
};

btHeightfieldTerrainShape.prototype["setLocalScaling"] = btHeightfieldTerrainShape.prototype.setLocalScaling = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(scaling) {
  var self = this.ptr;
  if (scaling && typeof scaling === "object") scaling = scaling.ptr;
  _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1(self, scaling);
};

btHeightfieldTerrainShape.prototype["__destroy__"] = btHeightfieldTerrainShape.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btHeightfieldTerrainShape___destroy___0(self);
};

// btDefaultCollisionConstructionInfo
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDefaultCollisionConstructionInfo() {
  this.ptr = _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0();
  getCache(btDefaultCollisionConstructionInfo)[this.ptr] = this;
}

btDefaultCollisionConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btDefaultCollisionConstructionInfo.prototype.constructor = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype.__class__ = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.__cache__ = {};

Module["btDefaultCollisionConstructionInfo"] = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype["__destroy__"] = btDefaultCollisionConstructionInfo.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0(self);
};

// btDefaultCollisionConfiguration
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDefaultCollisionConfiguration(info) {
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

btDefaultCollisionConfiguration.prototype["__destroy__"] = btDefaultCollisionConfiguration.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDefaultCollisionConfiguration___destroy___0(self);
};

// btDispatcher
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDispatcher() {
  throw "cannot construct a btDispatcher, no constructor in IDL";
}

btDispatcher.prototype = Object.create(WrapperObject.prototype);

btDispatcher.prototype.constructor = btDispatcher;

btDispatcher.prototype.__class__ = btDispatcher;

btDispatcher.__cache__ = {};

Module["btDispatcher"] = btDispatcher;

btDispatcher.prototype["__destroy__"] = btDispatcher.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDispatcher___destroy___0(self);
};

// btCollisionDispatcher
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCollisionDispatcher(conf) {
  if (conf && typeof conf === "object") conf = conf.ptr;
  this.ptr = _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1(conf);
  getCache(btCollisionDispatcher)[this.ptr] = this;
}

btCollisionDispatcher.prototype = Object.create(WrapperObject.prototype);

btCollisionDispatcher.prototype.constructor = btCollisionDispatcher;

btCollisionDispatcher.prototype.__class__ = btCollisionDispatcher;

btCollisionDispatcher.__cache__ = {};

Module["btCollisionDispatcher"] = btCollisionDispatcher;

btCollisionDispatcher.prototype["__destroy__"] = btCollisionDispatcher.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCollisionDispatcher___destroy___0(self);
};

// btOverlappingPairCallback
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btOverlappingPairCallback() {
  throw "cannot construct a btOverlappingPairCallback, no constructor in IDL";
}

btOverlappingPairCallback.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCallback.prototype.constructor = btOverlappingPairCallback;

btOverlappingPairCallback.prototype.__class__ = btOverlappingPairCallback;

btOverlappingPairCallback.__cache__ = {};

Module["btOverlappingPairCallback"] = btOverlappingPairCallback;

btOverlappingPairCallback.prototype["__destroy__"] = btOverlappingPairCallback.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btOverlappingPairCallback___destroy___0(self);
};

// btOverlappingPairCache
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btOverlappingPairCache() {
  throw "cannot construct a btOverlappingPairCache, no constructor in IDL";
}

btOverlappingPairCache.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCache.prototype.constructor = btOverlappingPairCache;

btOverlappingPairCache.prototype.__class__ = btOverlappingPairCache;

btOverlappingPairCache.__cache__ = {};

Module["btOverlappingPairCache"] = btOverlappingPairCache;

btOverlappingPairCache.prototype["setInternalGhostPairCallback"] = btOverlappingPairCache.prototype.setInternalGhostPairCallback = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(ghostPairCallback) {
  var self = this.ptr;
  if (ghostPairCallback && typeof ghostPairCallback === "object") ghostPairCallback = ghostPairCallback.ptr;
  _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1(self, ghostPairCallback);
};

btOverlappingPairCache.prototype["__destroy__"] = btOverlappingPairCache.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btOverlappingPairCache___destroy___0(self);
};

// btBroadphaseInterface
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btBroadphaseInterface() {
  throw "cannot construct a btBroadphaseInterface, no constructor in IDL";
}

btBroadphaseInterface.prototype = Object.create(WrapperObject.prototype);

btBroadphaseInterface.prototype.constructor = btBroadphaseInterface;

btBroadphaseInterface.prototype.__class__ = btBroadphaseInterface;

btBroadphaseInterface.__cache__ = {};

Module["btBroadphaseInterface"] = btBroadphaseInterface;

btBroadphaseInterface.prototype["getOverlappingPairCache"] = btBroadphaseInterface.prototype.getOverlappingPairCache = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btBroadphaseInterface_getOverlappingPairCache_0(self), btOverlappingPairCache);
};

btBroadphaseInterface.prototype["__destroy__"] = btBroadphaseInterface.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btBroadphaseInterface___destroy___0(self);
};

// btCollisionConfiguration
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btCollisionConfiguration() {
  throw "cannot construct a btCollisionConfiguration, no constructor in IDL";
}

btCollisionConfiguration.prototype = Object.create(WrapperObject.prototype);

btCollisionConfiguration.prototype.constructor = btCollisionConfiguration;

btCollisionConfiguration.prototype.__class__ = btCollisionConfiguration;

btCollisionConfiguration.__cache__ = {};

Module["btCollisionConfiguration"] = btCollisionConfiguration;

btCollisionConfiguration.prototype["__destroy__"] = btCollisionConfiguration.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btCollisionConfiguration___destroy___0(self);
};

// btDbvtBroadphase
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDbvtBroadphase() {
  this.ptr = _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0();
  getCache(btDbvtBroadphase)[this.ptr] = this;
}

btDbvtBroadphase.prototype = Object.create(WrapperObject.prototype);

btDbvtBroadphase.prototype.constructor = btDbvtBroadphase;

btDbvtBroadphase.prototype.__class__ = btDbvtBroadphase;

btDbvtBroadphase.__cache__ = {};

Module["btDbvtBroadphase"] = btDbvtBroadphase;

btDbvtBroadphase.prototype["optimize"] = btDbvtBroadphase.prototype.optimize = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDbvtBroadphase_optimize_0(self);
};

btDbvtBroadphase.prototype["__destroy__"] = btDbvtBroadphase.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDbvtBroadphase___destroy___0(self);
};

// btRigidBodyConstructionInfo
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia) {
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

btRigidBodyConstructionInfo.prototype["__destroy__"] = btRigidBodyConstructionInfo.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btRigidBodyConstructionInfo___destroy___0(self);
};

// btRigidBody
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btRigidBody(constructionInfo) {
  if (constructionInfo && typeof constructionInfo === "object") constructionInfo = constructionInfo.ptr;
  this.ptr = _emscripten_bind_btRigidBody_btRigidBody_1(constructionInfo);
  getCache(btRigidBody)[this.ptr] = this;
}

btRigidBody.prototype = Object.create(btCollisionObject.prototype);

btRigidBody.prototype.constructor = btRigidBody;

btRigidBody.prototype.__class__ = btRigidBody;

btRigidBody.__cache__ = {};

Module["btRigidBody"] = btRigidBody;

btRigidBody.prototype["isStaticObject"] = btRigidBody.prototype.isStaticObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btRigidBody_isStaticObject_0(self));
};

btRigidBody.prototype["getWorldTransform"] = btRigidBody.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btRigidBody_getWorldTransform_0(self), btTransform);
};

btRigidBody.prototype["setCollisionFlags"] = btRigidBody.prototype.setCollisionFlags = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(flags) {
  var self = this.ptr;
  if (flags && typeof flags === "object") flags = flags.ptr;
  _emscripten_bind_btRigidBody_setCollisionFlags_1(self, flags);
};

btRigidBody.prototype["setWorldTransform"] = btRigidBody.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btRigidBody_setWorldTransform_1(self, worldTrans);
};

btRigidBody.prototype["setCollisionShape"] = btRigidBody.prototype.setCollisionShape = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionShape) {
  var self = this.ptr;
  if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
  _emscripten_bind_btRigidBody_setCollisionShape_1(self, collisionShape);
};

btRigidBody.prototype["setUserIndex"] = btRigidBody.prototype.setUserIndex = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(index) {
  var self = this.ptr;
  if (index && typeof index === "object") index = index.ptr;
  _emscripten_bind_btRigidBody_setUserIndex_1(self, index);
};

btRigidBody.prototype["__destroy__"] = btRigidBody.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btRigidBody___destroy___0(self);
};

// btSequentialImpulseConstraintSolver
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btSequentialImpulseConstraintSolver() {
  this.ptr = _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0();
  getCache(btSequentialImpulseConstraintSolver)[this.ptr] = this;
}

btSequentialImpulseConstraintSolver.prototype = Object.create(btConstraintSolver.prototype);

btSequentialImpulseConstraintSolver.prototype.constructor = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype.__class__ = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.__cache__ = {};

Module["btSequentialImpulseConstraintSolver"] = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype["__destroy__"] = btSequentialImpulseConstraintSolver.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0(self);
};

// btDiscreteDynamicsWorld
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btDiscreteDynamicsWorld(dispatcher, pairCache, constraintSolver, collisionConfiguration) {
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

btDiscreteDynamicsWorld.prototype["setGravity"] = btDiscreteDynamicsWorld.prototype.setGravity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(gravity) {
  var self = this.ptr;
  if (gravity && typeof gravity === "object") gravity = gravity.ptr;
  _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1(self, gravity);
};

btDiscreteDynamicsWorld.prototype["addRigidBody"] = btDiscreteDynamicsWorld.prototype.addRigidBody = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(body, group, mask) {
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

btDiscreteDynamicsWorld.prototype["removeRigidBody"] = btDiscreteDynamicsWorld.prototype.removeRigidBody = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(body) {
  var self = this.ptr;
  if (body && typeof body === "object") body = body.ptr;
  _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1(self, body);
};

btDiscreteDynamicsWorld.prototype["stepSimulation"] = btDiscreteDynamicsWorld.prototype.stepSimulation = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(timeStep, maxSubSteps, fixedTimeStep) {
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

btDiscreteDynamicsWorld.prototype["getDispatcher"] = btDiscreteDynamicsWorld.prototype.getDispatcher = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDiscreteDynamicsWorld.prototype["addCollisionObject"] = btDiscreteDynamicsWorld.prototype.addCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject, collisionFilterGroup, collisionFilterMask) {
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

btDiscreteDynamicsWorld.prototype["removeCollisionObject"] = btDiscreteDynamicsWorld.prototype.removeCollisionObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionObject) {
  var self = this.ptr;
  if (collisionObject && typeof collisionObject === "object") collisionObject = collisionObject.ptr;
  _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1(self, collisionObject);
};

btDiscreteDynamicsWorld.prototype["getBroadphase"] = btDiscreteDynamicsWorld.prototype.getBroadphase = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDiscreteDynamicsWorld.prototype["addAction"] = btDiscreteDynamicsWorld.prototype.addAction = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(action) {
  var self = this.ptr;
  if (action && typeof action === "object") action = action.ptr;
  _emscripten_bind_btDiscreteDynamicsWorld_addAction_1(self, action);
};

btDiscreteDynamicsWorld.prototype["__destroy__"] = btDiscreteDynamicsWorld.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btDiscreteDynamicsWorld___destroy___0(self);
};

// btKinematicCharacterController
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btKinematicCharacterController(ghostObject, convexShape, stepHeight, up) {
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

btKinematicCharacterController.prototype["setWalkDirection"] = btKinematicCharacterController.prototype.setWalkDirection = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(walkDirection) {
  var self = this.ptr;
  if (walkDirection && typeof walkDirection === "object") walkDirection = walkDirection.ptr;
  _emscripten_bind_btKinematicCharacterController_setWalkDirection_1(self, walkDirection);
};

btKinematicCharacterController.prototype["warp"] = btKinematicCharacterController.prototype.warp = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(origin) {
  var self = this.ptr;
  if (origin && typeof origin === "object") origin = origin.ptr;
  _emscripten_bind_btKinematicCharacterController_warp_1(self, origin);
};

btKinematicCharacterController.prototype["setJumpSpeed"] = btKinematicCharacterController.prototype.setJumpSpeed = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(jumpSpeed) {
  var self = this.ptr;
  if (jumpSpeed && typeof jumpSpeed === "object") jumpSpeed = jumpSpeed.ptr;
  _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1(self, jumpSpeed);
};

btKinematicCharacterController.prototype["jump"] = btKinematicCharacterController.prototype.jump = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(up) {
  var self = this.ptr;
  if (up && typeof up === "object") up = up.ptr;
  if (up === undefined) {
    _emscripten_bind_btKinematicCharacterController_jump_0(self);
    return;
  }
  _emscripten_bind_btKinematicCharacterController_jump_1(self, up);
};

btKinematicCharacterController.prototype["setGravity"] = btKinematicCharacterController.prototype.setGravity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(gravity) {
  var self = this.ptr;
  if (gravity && typeof gravity === "object") gravity = gravity.ptr;
  _emscripten_bind_btKinematicCharacterController_setGravity_1(self, gravity);
};

btKinematicCharacterController.prototype["setMaxSlope"] = btKinematicCharacterController.prototype.setMaxSlope = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(slopeRadians) {
  var self = this.ptr;
  if (slopeRadians && typeof slopeRadians === "object") slopeRadians = slopeRadians.ptr;
  _emscripten_bind_btKinematicCharacterController_setMaxSlope_1(self, slopeRadians);
};

btKinematicCharacterController.prototype["onGround"] = btKinematicCharacterController.prototype.onGround = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btKinematicCharacterController_onGround_0(self));
};

btKinematicCharacterController.prototype["setMaxPenetrationDepth"] = btKinematicCharacterController.prototype.setMaxPenetrationDepth = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(d) {
  var self = this.ptr;
  if (d && typeof d === "object") d = d.ptr;
  _emscripten_bind_btKinematicCharacterController_setMaxPenetrationDepth_1(self, d);
};

btKinematicCharacterController.prototype["setStepHeight"] = btKinematicCharacterController.prototype.setStepHeight = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(h) {
  var self = this.ptr;
  if (h && typeof h === "object") h = h.ptr;
  _emscripten_bind_btKinematicCharacterController_setStepHeight_1(self, h);
};

btKinematicCharacterController.prototype["getVerticalVelocity"] = btKinematicCharacterController.prototype.getVerticalVelocity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btKinematicCharacterController_getVerticalVelocity_0(self);
};

btKinematicCharacterController.prototype["setVerticalVelocity"] = btKinematicCharacterController.prototype.setVerticalVelocity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(vel) {
  var self = this.ptr;
  if (vel && typeof vel === "object") vel = vel.ptr;
  _emscripten_bind_btKinematicCharacterController_setVerticalVelocity_1(self, vel);
};

btKinematicCharacterController.prototype["resetFall"] = btKinematicCharacterController.prototype.resetFall = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btKinematicCharacterController_resetFall_0(self);
};

btKinematicCharacterController.prototype["getVerticalOffset"] = btKinematicCharacterController.prototype.getVerticalOffset = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btKinematicCharacterController_getVerticalOffset_0(self);
};

btKinematicCharacterController.prototype["getJumpAxis"] = btKinematicCharacterController.prototype.getJumpAxis = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btKinematicCharacterController_getJumpAxis_0(self), btVector3);
};

btKinematicCharacterController.prototype["addExternalVelocity"] = btKinematicCharacterController.prototype.addExternalVelocity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(velocity) {
  var self = this.ptr;
  if (velocity && typeof velocity === "object") velocity = velocity.ptr;
  _emscripten_bind_btKinematicCharacterController_addExternalVelocity_1(self, velocity);
};

btKinematicCharacterController.prototype["setExternalVelocity"] = btKinematicCharacterController.prototype.setExternalVelocity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(velocity) {
  var self = this.ptr;
  if (velocity && typeof velocity === "object") velocity = velocity.ptr;
  _emscripten_bind_btKinematicCharacterController_setExternalVelocity_1(self, velocity);
};

btKinematicCharacterController.prototype["setExternalVelocityAirDampingFactor"] = btKinematicCharacterController.prototype.setExternalVelocityAirDampingFactor = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(damping) {
  var self = this.ptr;
  if (damping && typeof damping === "object") damping = damping.ptr;
  _emscripten_bind_btKinematicCharacterController_setExternalVelocityAirDampingFactor_1(self, damping);
};

btKinematicCharacterController.prototype["setExternalVelocityGroundDampingFactor"] = btKinematicCharacterController.prototype.setExternalVelocityGroundDampingFactor = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(damping) {
  var self = this.ptr;
  if (damping && typeof damping === "object") damping = damping.ptr;
  _emscripten_bind_btKinematicCharacterController_setExternalVelocityGroundDampingFactor_1(self, damping);
};

btKinematicCharacterController.prototype["getExternalVelocity"] = btKinematicCharacterController.prototype.getExternalVelocity = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btKinematicCharacterController_getExternalVelocity_0(self), btVector3);
};

btKinematicCharacterController.prototype["isJumping"] = btKinematicCharacterController.prototype.isJumping = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btKinematicCharacterController_isJumping_0(self));
};

btKinematicCharacterController.prototype["getFloorUserIndex"] = btKinematicCharacterController.prototype.getFloorUserIndex = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btKinematicCharacterController_getFloorUserIndex_0(self);
};

btKinematicCharacterController.prototype["__destroy__"] = btKinematicCharacterController.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btKinematicCharacterController___destroy___0(self);
};

// btPairCachingGhostObject
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btPairCachingGhostObject() {
  this.ptr = _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0();
  getCache(btPairCachingGhostObject)[this.ptr] = this;
}

btPairCachingGhostObject.prototype = Object.create(btGhostObject.prototype);

btPairCachingGhostObject.prototype.constructor = btPairCachingGhostObject;

btPairCachingGhostObject.prototype.__class__ = btPairCachingGhostObject;

btPairCachingGhostObject.__cache__ = {};

Module["btPairCachingGhostObject"] = btPairCachingGhostObject;

btPairCachingGhostObject.prototype["isStaticObject"] = btPairCachingGhostObject.prototype.isStaticObject = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return !!(_emscripten_bind_btPairCachingGhostObject_isStaticObject_0(self));
};

btPairCachingGhostObject.prototype["getWorldTransform"] = btPairCachingGhostObject.prototype.getWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0(self), btTransform);
};

btPairCachingGhostObject.prototype["setCollisionFlags"] = btPairCachingGhostObject.prototype.setCollisionFlags = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(flags) {
  var self = this.ptr;
  if (flags && typeof flags === "object") flags = flags.ptr;
  _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1(self, flags);
};

btPairCachingGhostObject.prototype["setWorldTransform"] = btPairCachingGhostObject.prototype.setWorldTransform = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(worldTrans) {
  var self = this.ptr;
  if (worldTrans && typeof worldTrans === "object") worldTrans = worldTrans.ptr;
  _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1(self, worldTrans);
};

btPairCachingGhostObject.prototype["setCollisionShape"] = btPairCachingGhostObject.prototype.setCollisionShape = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(collisionShape) {
  var self = this.ptr;
  if (collisionShape && typeof collisionShape === "object") collisionShape = collisionShape.ptr;
  _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1(self, collisionShape);
};

btPairCachingGhostObject.prototype["setUserIndex"] = btPairCachingGhostObject.prototype.setUserIndex = /** @suppress {undefinedVars, duplicate} @this{Object} */ function(index) {
  var self = this.ptr;
  if (index && typeof index === "object") index = index.ptr;
  _emscripten_bind_btPairCachingGhostObject_setUserIndex_1(self, index);
};

btPairCachingGhostObject.prototype["getNumOverlappingObjects"] = btPairCachingGhostObject.prototype.getNumOverlappingObjects = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  return _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0(self);
};

btPairCachingGhostObject.prototype["__destroy__"] = btPairCachingGhostObject.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btPairCachingGhostObject___destroy___0(self);
};

// btGhostPairCallback
/** @suppress {undefinedVars, duplicate} @this{Object} */ function btGhostPairCallback() {
  this.ptr = _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0();
  getCache(btGhostPairCallback)[this.ptr] = this;
}

btGhostPairCallback.prototype = Object.create(WrapperObject.prototype);

btGhostPairCallback.prototype.constructor = btGhostPairCallback;

btGhostPairCallback.prototype.__class__ = btGhostPairCallback;

btGhostPairCallback.__cache__ = {};

Module["btGhostPairCallback"] = btGhostPairCallback;

btGhostPairCallback.prototype["__destroy__"] = btGhostPairCallback.prototype.__destroy__ = /** @suppress {undefinedVars, duplicate} @this{Object} */ function() {
  var self = this.ptr;
  _emscripten_bind_btGhostPairCallback___destroy___0(self);
};

(function() {
  function setupEnums() {
    // $PHY_ScalarType
    Module["PHY_FLOAT"] = _emscripten_enum_PHY_ScalarType_PHY_FLOAT();
    Module["PHY_DOUBLE"] = _emscripten_enum_PHY_ScalarType_PHY_DOUBLE();
    Module["PHY_INTEGER"] = _emscripten_enum_PHY_ScalarType_PHY_INTEGER();
    Module["PHY_SHORT"] = _emscripten_enum_PHY_ScalarType_PHY_SHORT();
    Module["PHY_FIXEDPOINT88"] = _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88();
    Module["PHY_UCHAR"] = _emscripten_enum_PHY_ScalarType_PHY_UCHAR();
  }
  if (runtimeInitialized) setupEnums(); else addOnInit(setupEnums);
})();

// end include: glue.js
// include: /home/casey/ammo.js/onload.js
Module["CONTACT_ADDED_CALLBACK_SIGNATURE"] = "iiiiiiii";

Module["CONTACT_DESTROYED_CALLBACK_SIGNATURE"] = "ii";

Module["CONTACT_PROCESSED_CALLBACK_SIGNATURE"] = "iiii";

Module["INTERNAL_TICK_CALLBACK_SIGNATURE"] = "vif";

// Reassign global Ammo to the loaded module:
this["Ammo"] = Module;

// end include: /home/casey/ammo.js/onload.js
// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
// We assign to the `moduleRtn` global here and configure closure to see
// this as and extern so it won't get minified.
moduleRtn = readyPromise;


  return moduleRtn;
}
);
})();
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = Ammo;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = Ammo;
} else if (typeof define === 'function' && define['amd'])
  define([], () => Ammo);
export {Ammo};
