//http://bl.ocks.org/domitry/10023888   ; 3D surface with three.js
//http://complexity.zone/webgl_threejs_surface_graph/    ; 

// https://gitgud.io/unconed/mathbox     // DOC etc.
// https://gitgud.io/unconed/mathbox/tree/master/docs

// http://cim.mcgill.ca/~gamboa/cs202/js/MathBox.js/README.md
// view-source: http://acko.net/files/mathbox/MathBox.js/examples/ComplexExponentiation.html

// https://groups.google.com/forum/#!forum/mathbox

var _mb_context = function () 
{

    var WIDTH = 640;
    var HEIGHT = 480;

    // Vanilla Three.js
    var renderer = new THREE.WebGLRenderer();
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, .01, 1000);

    // Insert into document
    document.body.appendChild(renderer.domElement);

    // MathBox context
    var context = new MathBox.Context(renderer, scene, camera).init();
    var mathbox = context.api;

    // Set size
    renderer.setSize(WIDTH, HEIGHT);
    context.resize({ viewWidth: WIDTH, viewHeight: HEIGHT });

    // Place camera and set background
    camera.position.set(0, 0, 3);
    renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    // MathBox elements
    var view = mathbox
    .set({
      focus: 3,
    })
    .cartesian({
      range: [[-2, 2], [-1, 1], [-1, 1]],
      scale: [2, 1, 1],
    });

    view.axis({
      detail: 30,
    });

    view.axis({
      axis: 2,
    });
    
    view.scale({
      divide: 10,
    })
    view.ticks({
      classes: ['foo', 'bar'],
      width: 2
    });

    view.grid({
      divideX: 30,
      width: 1,
      opacity: 0.5,
      zBias: -5,
    });

    view.interval({
      id: 'sampler',
      width: 64,
      expr: function (emit, x, i, t) {
        y = Math.sin(x + t) * .7;
        emit(x, y);
      },
      channels: 2,
    });

    view.line({
      points: '#sampler',
      color: 0x3090FF,
      width: 5,
    });

    frame = function () {
      requestAnimationFrame(frame);
      context.frame();
      renderer.render(scene, camera);
    };

    requestAnimationFrame(frame);
}

var _mb_cube = function () {
  mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor'],
      controls: {
        klass: THREE.OrbitControls,
      },
      camera: {
      }
    });

    three = mathbox.three;
    three.controls.maxDistance = 4;
    three.camera.position.set(2.5, 1, 2.5);
    three.renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);

    view = mathbox
    .set({
      scale: 720,
      focus: 1
    })
    .cartesian({
      range: [[0, 1], [0, 1], [0, 1]],
      scale: [1, 1, 1],
    })

    var rez = 10;
    view.volume({
      id: "volume",
      width: rez,
      height: rez,
      depth: rez,
      items: 1,
      channels: 4,
      expr: function(emit, x, y, z){
          emit(x,y,z,1);
      }
    })
    view.point({
      // The neat trick: use the same data for position and for color!
      // We don't actually need to specify the points source since we just defined them
      // but it emphasizes what's going on.
      // The w component 1 is ignored as a position but used as opacity as a color.
      points: "#volume",
      colors: "#volume",
      // Multiply every color component in [0..1] by 255
      color: 0xffffff,
      size: 20,
    });
}

var _mb_surface = function () {
mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor', 'stats'],
      controls: {
        klass: THREE.OrbitControls
      },
    });
    three = mathbox.three;

    three.camera.position.set(-3.5, 2.2, -3.3);
    three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    view = mathbox.cartesian({
      range: [[-3, 3], [0, 1], [-3, 3]],
      scale: [2, 1, 2],
    });

    view.axis({
      axis: 1,
    });
    view.axis({
      axis: 3,
    });

    view.grid({
      width: 5,
      opacity: 0.5,
      axes: [1, 3],
    });

    var sampler = view.area({
      id: 'sampler',
      width: 64,
      height: 64,
      axes: [1, 3],
      expr: function (emit, x, y, i, j, time) {
        emit(x, .35 + .25 * (Math.sin(x + time) * Math.sin(y + time)), y);
        emit(x, .35 + .25 * (Math.sin(x * 1.31 + time * 1.13) * Math.sin(y * 1.46 - time * .94)) + .5, y);
        emit(x, .35 + .25 * (Math.sin(x * 1.25 + Math.sin(y + time) - time * 1.34) * Math.sin(y * 1.17 - time * .79)) + 1, y);
      },
      items: 3,
      channels: 3,
    });

    var color = view.matrix({
      expr: function (emit, i, j, time) {
        var r = .5 + Math.cos(time * .873) * j;
        var g = .5 + Math.sin(time) * i;
        var b = 1;
        var m = g * .75;
        var n = (r + g + b) / 3;

        r = Math.max(r, m, n*n);
        g = Math.max(g, m, n*n);
        b = Math.max(b, m, n*n);

        var rr = (r * r + r * Math.sin(time * .354)) / 2 * .9;
        var gg = b + (r + g) * .25 * Math.cos(time * .289)
        var bb = g + r * .5 + b * .5;

        rr = rr + (n - rr) * .75
        gg = gg + (n - gg) * .75
        bb = bb + (n - bb) * .75

        emit(.4, .7, 1, 1);
        emit(1, 1, 1, 1);
        emit(rr, gg, bb, 1);
      },
      width:  2,
      height: 2,
      items:  3,
      channels: 4,
    })
    .repeat({
      id: 'color',
    });

    view.surface({
      shaded: true,
      lineX: true,
      lineY: true,
      points: sampler,
      colors: color,
      color: 0xFFFFFF,
      width: 5,
    });
}

function _mb_procedural () {
 mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor'],
      controls: {
        klass: THREE.OrbitControls
      },
    });
    three = mathbox.three;

    three.camera.position.set(3.5, 1.4, -2.3);
    three.renderer.setClearColor(new THREE.Color(0x204060), 1.0);

    time = 0
    three.on('update', function () {
      clock = three.Time.clock
      time = clock / 4

      t = Math.max(clock - 1, 0) / 12
      t = t < .5 ? t * t : t - .25

      o = .5 - .5 * Math.cos(Math.min(1, t) * π)

      c = Math.cos(t);
      s = Math.sin(t);
      view.set('quaternion', [0, -s, 0, c]);
      surface.set('opacity', 1 - o * .25);

      f = 1 + o;
      view.set('range', [[-3 * f, 3 * f], [0, 6], [-3 * f, 3 * f]]);
      view.set('scale', [2*f, 2, 2*f]);
    });

    view = mathbox
      .unit({
        scale: 720,
      })
      .cartesian({
        range: [[-3, 3], [0, 6], [-3, 3]],
        scale: [2, 2, 2],
      });

    view.grid({
      width: 5,
      opacity: 0.5,
      axes: [1, 3],
    });

    view.area({
      width: 36,
      height: 36,
      items: 2,
      axes: [1, 3],
      expr: function (emit, x, y, i, j) {
        a = (Math.sin(i * 31.718 - time) * Math.sin(j * 21.131 + time))
        b = (Math.sin(i * 27.41 + time) * Math.sin(j * 11.91 + 5 * Math.cos(i * 4.1) + time))
        emit(x, 3 * (1 + a), y);
        emit(x, 3 * (1 + a + b * .25), y);
      },
      channels: 3,
    });
    view.vector({
      color: 0xA0D0FF,
      width: 5,
      start: false,
      end: true,
    });

    view.area({
      id: 'sampler',
      width: 83,
      height: 83,
      axes: [1, 3],
      expr: function (emit, x, y, i, j) {
        emit(x, 3 * (.5 + .5 * (Math.sin(x + time) * Math.sin(y + time))), y);
      },
      channels: 3,
    });
    view.surface({
      lineX: true,
      lineY: true,
      shaded: true,
      color: 0x5090FF,
      width: 5,
    });

    surface = mathbox.select('surface');
    vector = mathbox.select('vector');
    }
    
// http://acko.net/files/mathbox/MathBox.js/examples/ComplexCircle.html

function _mb_vertexcolor () {
    mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor', 'stats'],
      controls: {
        klass: THREE.OrbitControls
      },
    });
    three = mathbox.three;

    three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    var view = mathbox
    .set({
      scale: 720,
      focus: 5,
    })
    .camera({
      proxy: true,
      position: [2, 1, 3],
    })
    .cartesian({
      range: [[0, 1], [0, 1], [0, 1]],
      scale: [1, 2/3, 1],
    });

    view.axis({
      axis: 1,
      width: 3,
    });
    view.axis({
      axis: 2,
      width: 3,
    });
    view.axis({
      axis: 3,
      width: 3,
    });

    view.grid({
      width: 2,
      opacity: 0.5,
      axes: [1, 2],
      zOrder: 1,
    });
    view.grid({
      width: 2,
      opacity: 0.5,
      axes: [2, 3],
      zOrder: 1,
    });
    view.grid({
      width: 2,
      opacity: 0.5,
      axes: [1, 3],
      zOrder: 1,
    });

    var remap = function (v) { return Math.sqrt(.5 + .5 * v); };

    var points = view.area({
      expr: function (emit, x, z, i, j, t) {
        var y = remap(Math.sin(x * 5 + t + Math.sin(z * 3.41 + x * 1.48)))
              * remap(Math.sin(z * 5 + t + Math.cos(x * 3.22 + z)));
        emit(x, y, z);
      },
      width:  32,
      height: 32,
      channels: 3,
      axes: [1, 3],
    });

    var colors = view.area({
      expr: function (emit, x, z, i, j, t) {
        var y = remap(Math.sin(x * 5 + t + Math.sin(z * 3.41 + x * 1.48)))
              * remap(Math.sin(z * 5 + t + Math.cos(x * 3.22 + z)));

        var r = Math.sin(y * 4) + y * y * y; 
        var g = (.5 - .5 * Math.cos(y * 3) + y * y) * .85;
        var b = y;

        emit(r, g, b, 1.0);
      },
      width:  32,
      height: 32,
      channels: 4,
      axes: [1, 3],
    });

    view.surface({
      shaded: true,
      points: '<<',
      colors: '<',
      color: 0xFFFFFF,
    });

    view.surface({
      fill: false,
      lineX: true,
      lineY: true,
      points: '<<',
      colors: '<',
      color: 0xFFFFFF,
      width: 2,
      blending: 'add',
      opacity: .25,
      zBias: 5,
    });
}

function _mb_empty() {

 var mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor', 'mathbox'],
      controls: {
        // Orbit controls, i.e. Euler angles, with gimbal lock
        klass: THREE.OrbitControls,

        // Trackball controls, i.e. Free quaternion rotation
        //klass: THREE.TrackballControls,
      },
    });
    if (mathbox.fallback) throw "WebGL not supported"

    var three = mathbox.three;
    three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

    // Do stuff with mathbox,
    // for example: (see docs/intro.md)
   

    // Place camera
    var camera =
      mathbox
      .camera({
        proxy: true,
        position: [0, 0, 3],
      });

    // 2D cartesian
    var view =
      mathbox
      .cartesian({
        range: [[-2, 2], [-1, 1]],
        scale: [2, 1],
      });

    // Axes + grid
    view
      .axis({
        axis: 1,
        width: 3,
      })
      .axis({
        axis: 2,
        width: 3,
      })
      .grid({
        width: 2,  
        divideX: 20,
        divideY: 10,        
      });

    // Make axes black
    mathbox.select('axis').set('color', 'black');

    // Calibrate focus distance for units
    mathbox.set('focus', 3);

    // Add some data
    var data =
      view
      .interval({
        expr: function (emit, x, i, t) {
          emit(x, Math.sin(x + t));
        },
        width: 64,
        channels: 2,
      });
    
    // Draw a curve
    var curve =
      view
      .line({
        width: 5,
        color: '#3090FF',
      });

    // Draw some points
    var points =
      view
      .point({
        size: 8,
        color: '#3090FF',
      });
    
    // Draw vectors
    var vector =
      view.interval({
        expr: function (emit, x, i, t) {
          emit(x, 0);
          emit(x, -Math.sin(x + t));
        },
        width: 64,
        channels: 2,
        items: 2,
      })
      .vector({
        end: true,
        width: 5,
        color: '#50A000',
      });
    
    // Draw ticks and labels
    var scale =
      view.scale({
        divide: 10,
      });
    
    var ticks =
      view.ticks({
        width: 5,
        size: 15,
        color: 'black',
      });
    
    var format =
      view.format({
        digits: 2,
        weight: 'bold',
      });

    var labels =
      view.label({
        color: 'red',
        zIndex: 1,
      });
          
    // Animate
    var play = mathbox.play({
      target: 'cartesian',
      pace: 5,
      to: 2,
      loop: false, // true
      script: [
        {props: {range: [[-2, 2], [-1, 1]]}},
        {props: {range: [[-4, 4], [-2, 2]]}},
        {props: {range: [[-2, 2], [-1, 1]]}},
      ]
    });
}


function _mb_scatterX() {
    mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor'],
      controls: {
        klass: THREE.OrbitControls
      },
    });
    three = mathbox.three;
    three.camera.position.set(2.3, 1, 2);
    three.controls.maxDistance = 5;
    three.renderer.setClearColor(new THREE.Color(0xFAFAF8), 1.0);
    view = mathbox.cartesian({
      range: [[0, 2], [0, 1], [0, 1]],
      scale: [2, 1, 1],
    });
    var colors = {
      x: 0xFF4136,   // red
      y: 0xFFDC00,   // yellow
      z: 0x0074D9,   // blue
      xy: 0xFF851B,  // orange
      xz: 0xB10DC9,  // purple
      yz: 0x2ECC40,  // green
      xyz: 0x654321, // brown
    }
    view.scale({
      divide: 5,
      origin: [0,0,1,0],
      axis: "x",
    }).text({
      live: false,
      data: [0, "½", 1, "1½", 2]
    }).label({
      color: colors.x,
    })
    view.scale({
      divide: 3,
      origin: [0,0,1,0],
      axis: "y",
    }).text({
      live: false,
      data: [0, "½", 1]
    }).label({
      color: colors.y,
      offset: [-16, 0]
    })
    view.scale({
      divide: 3,
      origin: [2,0,0,0],
      axis: "z",
    }).text({
      live: false,
      data: [0, "½", 1]
    }).label({
      color: colors.z,
      offset: [16, 0]
    })
    view.grid({
      axes: "xy",
      divideX: 3,
      divideY: 3
    })
    .grid({
      axes: "xz",
      divideX: 3,
      divideY: 3,
    })
    .grid({
      axes: "yz",
      divideX: 3,
      divideY: 3,
    })
    var n = 32; // number of data points
    view.array({
      id: 'data',
      width: n,
      items: 1,
      channels: 3, // 3 spacial dimensions
      live: false,
      expr: function (emit) {
        emit(Math.random()*2, Math.random(), Math.random())
      },
    }).point({
      color: 0x222222,
      size: 12,
    });
    view.swizzle({
      source: '#data',
      order: "xyww"
    }).point({
      color: colors.xy,
      size: 7,
    });
    view.swizzle({
      source: '#data',
      order: "xwzw"
    }).point({
      color: colors.xz,
      size: 7,
    });
    view.swizzle({
      source: '#data',
      order: "wyzw"
    }).point({
      color: colors.yz,
      size: 7,
    });
    view.transform({
      position: [0, 1, 0],
    }).swizzle({
      source: '#data',
      order: "xwww"
    }).repeat({
      items: 2,
    }).spread({
      unit: "absolute",
      alignItems: "first",
      items: [0, 0.04, 0, 0],
    }).vector({
      color: colors.x,
    });
    view.transform({
      position: [2, 0, 0],
    }).swizzle({
      source: '#data',
      order: "wyww"
    }).repeat({
      items: 2,
    }).spread({
      unit: "absolute",
      alignItems: "first",
      items: [0.04, 0, 0, 0],
    }).vector({
      color: colors.y,
    });
    view.transform({
      position: [0, 1, 0],
    }).swizzle({
      source: '#data',
      order: "wwzw"
    }).repeat({
      items: 2,
    }).spread({
      unit: "absolute",
      alignItems: "first",
      items: [0, 0.04, 0, 0],
    }).vector({
      color: colors.z,
    });
}

function boot_mathbox() {
writeln("MATHBOX","color:green");
define_sysfun (new Sysfun ("mb-procedural", _mb_procedural,0,0,[],true)); // redef
define_sysfun (new Sysfun ("mb-context", _mb_context,0,0,true));
define_sysfun (new Sysfun ("mb-cube", _mb_cube,0,0,true));
define_sysfun (new Sysfun ("mb-surface", _mb_surface,0,0,true));
define_sysfun (new Sysfun ("mb-vertexcolor", _mb_vertexcolor,0,0,true));
define_sysfun (new Sysfun ("mb-empty", _mb_empty,0,0,true));
define_sysfun (new Sysfun ("mb-scatterX", _mb_scatterX,0,0,true));
}

boot_mathbox();

/*
THREE doc
https://github.com/unconed/threestrap/blob/master/docs/core.md
https://github.com/unconed/threestrap/blob/master/docs/extra.md
*/

// https://groups.google.com/forum/#!topic/mathbox/HL_pHL1wx7c   stop anim drop ball




