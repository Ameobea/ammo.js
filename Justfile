build:
  cmake -B builds -DCLOSURE=0   -DALLOW_MEMORY_GROWTH=1
  cd builds && make -j16
  echo "export {Ammo};" >> builds/ammo.wasm.js

  wasm-opt --enable-simd -ffm --vacuum -c -O4 -g builds/ammo.wasm.wasm -o builds/ammo.wasm.wasm

install:
  cp builds/ammo.wasm.* ~/dream/src/ammojs
  cp builds/ammo.wasm.* ~/dream/static

clean:
  rm -rf builds/*
