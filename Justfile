build:
  emcmake cmake -B builds -DCLOSURE=0   -DALLOW_MEMORY_GROWTH=1
  cd builds && make -j16
  if ! tail -n 1 builds/ammo.wasm.js | grep -qx 'export {Ammo};'; then echo "export {Ammo};" >> builds/ammo.wasm.js; fi

  wasm-opt --enable-simd -ffm --vacuum -c -O4 -g builds/ammo.wasm.wasm -o builds/ammo.wasm.wasm --enable-bulk-memory --enable-nontrapping-float-to-int

install:
  cp builds/ammo.wasm.* ~/dream/src/ammojs

clean:
  rm -rf builds/*
