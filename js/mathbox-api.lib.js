//http://bl.ocks.org/domitry/10023888   ; 3D surface with three.js
//http://complexity.zone/webgl_threejs_surface_graph/    ; 

// https://gitgud.io/unconed/mathbox     // DOC etc.
// https://gitgud.io/unconed/mathbox/tree/master/docs

// http://cim.mcgill.ca/~gamboa/cs202/js/MathBox.js/README.md
// view-source: http://acko.net/files/mathbox/MathBox.js/examples/ComplexExponentiation.html

// https://groups.google.com/forum/#!forum/mathbox

_require("mathbox.lib")

function page_click() {
	_MATHBOX.remove("*");
}

var _MATHBOX;
var _CONTEXT;
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
    _CONTEXT = context ;
    var mathbox = context.api;
    _MATHBOX = mathbox;
    console.log("mathbox context",mathbox);

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
    return renderer.domElement;
}



// http://acko.net/files/mathbox/MathBox.js/examples/ComplexCircle.html

function _mb_vertexcolor () {

	__toggle_visibility(document.getElementById("page"),"false");
	
    mathbox = mathBox({
      plugins: ['core', 'controls', 'cursor', 'stats'],
      controls: {
        klass: THREE.OrbitControls
      },
    });
    
     _MATHBOX = mathbox;
    console.log("mathbox vertexcolor",mathbox);
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

var _mb_version = function () {
writeln("Mathbox-2 0.0.5","color:green");
writeln("Mathbox-api 1.2","color:green");
}

// reloadable sysfuns
function boot_mathbox_api() {
define_sysfun (new Sysfun ("mb-context", _mb_context,0,0,[],true));
define_sysfun (new Sysfun ("mb-vertexcolor", _mb_vertexcolor,0,0,[],true));
define_sysfun (new Sysfun ("mb-version", _mb_version,0,0,[],true));
_mb_version();
}

boot_mathbox_api();

/*
THREE doc
https://github.com/unconed/threestrap/blob/master/docs/core.md
https://github.com/unconed/threestrap/blob/master/docs/extra.md
*/

// https://groups.google.com/forum/#!topic/mathbox/HL_pHL1wx7c   stop anim drop ball
// view-source:http://fm.acko.net/  use of embedded shaders




