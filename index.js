var scene 			= new THREE.Scene(),
	camera 			= new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	renderer 		= new THREE.WebGLRenderer({alpha: true, antialias: true}),
    clock 			= new THREE.Clock(),
    sphereGeometry 	= new THREE.IcosahedronGeometry( 2, 2 ),
    cubeGeometry 	= new THREE.CubeGeometry( 1, 1, 1 ),
    planeGeometry	= new THREE.Geometry(),
    material 		= new THREE.MeshBasicMaterial({color: 0xcccccc, wireframe:true, wireframeLinewidth:2}),
    lineMaterial	= new THREE.LineBasicMaterial({color: 0xcccccc, opacity: 0.3}),
    sphere 			= new THREE.Mesh(sphereGeometry, material),
    cube 			= new THREE.Mesh(cubeGeometry, material),
	particleCount 	= 1800,
    particles 		= new THREE.Geometry(),
    pMaterial 		= new THREE.ParticleBasicMaterial({
						color: 0xFFFFFF,
						size: 1
					}),
    particleSystem 	= null,
    stats 			= null,
    mode 			= 1,
    geometryMode	= 0,
    loader 			= new THREE.ColladaLoader();

if (window.webkitAudioContext) {
	var context	= new webkitAudioContext();
} else {
	var context	= new AudioContext();
}

var currentSecond = 0;
var analyser 		= context.createAnalyser();
var volume 			= context.createGain();

var renderPass, copyPass, kaleidoPass, composer;

var c, ctx, c2, ctx2, v, winWidth, winHeight, vHeight, c2Width, c2Height, ratio, animation;
var c, vhsctx, vhsc2, vhsctx2, vhsv, vhswinWidth, vhswinHeight, vhsvHeight, vhsc2Width, vhsc2Height, vhsratio, vhsanimation;

var lineInPower = .2;

var gridSize = 2500, gridStep = 10;


function setupStats() {
	stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms
	// Align top-left
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	document.body.appendChild( stats.domElement );
}

function setupScene() {

	loader.options.convertUpAxis = true;

	scene.fog = new THREE.Fog(0x000000, 10, 100);
	scene.add(sphere);
    scene.add(cube);

    camera.position.z = 5;

    for (var p = 0; p < particleCount; p++) {

		// create a particle with random
		// position values, -250 -> 250
		var pX = Math.random() * 500 - 250,
		    pY = Math.random() * 500 - 250,
		    pZ = Math.random() * 500 - 250,
		    particle = new THREE.Vector3(pX, pY, pZ);

		// add it to the geometry
		particles.vertices.push(particle);
	}

	particleSystem = new THREE.ParticleSystem(
	    particles,
	    pMaterial);

	particleSystem.sortParticles = true;

	// add it to the scene
	scene.add(particleSystem);

	for (var i = -gridSize; i < gridSize; i += gridStep) {
		planeGeometry.vertices.push( new THREE.Vector3( - gridSize, 0, i ) );
    	planeGeometry.vertices.push( new THREE.Vector3(   gridSize, 0, i ) );

    	planeGeometry.vertices.push( new THREE.Vector3( i, 0, - gridSize ) );
    	planeGeometry.vertices.push( new THREE.Vector3( i, 0,   gridSize ) );
	}

	var line = new THREE.Line( planeGeometry, lineMaterial, THREE.LinePieces );
	scene.add( line );
	var upperLine = new THREE.Line( planeGeometry, lineMaterial, THREE.LinePieces );
	upperLine.position.y = 20;
	scene.add( upperLine );

	loader.load('column.dae', function(collada) {
		var dae = collada.scene;
		var object = collada.dae;
		// var skin = collada.skins[0];
		console.log(collada);
		setMaterial(dae, new THREE.MeshBasicMaterial({color: 0xcccccc, wireframe:true}));
		
		dae.scale.set(.2,.2,.2);
		// scene.add(dae);
		
		for (var i = 0; i < gridSize; i += gridStep * 5) {
			var newDae = dae.clone();
			var leftDae = dae.clone();
			newDae.position.set(20,0,-i);
			scene.add(newDae);
			leftDae.position.set(-20,0,-i);
			scene.add(leftDae);
		}
	});

	sphere.visible = false;
	cube.visible = false;
	particleSystem.visible = false;

}

var setMaterial = function(node, material) {
  node.material = material;
  if (node.children) {
    for (var i = 0; i < node.children.length; i++) {
      setMaterial(node.children[i], material);
    }
  }
}

function setupPostProcessing() {
	renderPass = new THREE.RenderPass( scene, camera );
	copyPass = new THREE.ShaderPass( THREE.CopyShader );

	kaleidoPass = new THREE.ShaderPass( THREE.KaleidoShader );

	filmPass = new THREE.ShaderPass( THREE.FilmShader );
	filmPass.uniforms[ "sCount" ].value = 800;
	filmPass.uniforms[ "sIntensity" ].value = 0.9;
	filmPass.uniforms[ "nIntensity" ].value = 0.4;

	dotScreenPass = new THREE.ShaderPass( THREE.DotScreenShader );

	horizontalBlurPass = new THREE.ShaderPass( THREE.HorizontalBlurShader );

	mirrorPass = new THREE.ShaderPass( THREE.MirrorShader );
				
	RGBShiftPass = new THREE.ShaderPass( THREE.RGBShiftShader );

	vignettePass = new THREE.ShaderPass( THREE.VignetteShader );
	vignettePass.uniforms[ "darkness" ].value = 2.0;

	badTVPass = new THREE.ShaderPass( THREE.BadTVShader );
	staticPass = new THREE.ShaderPass( THREE.StaticShader );

	badTVParams = {
				mute:true,
				show: true,
				distortion: 3.0,
				distortion2: 1.0,
				speed: 0.3,
				rollSpeed: 0.1
			}

			staticParams = {
				show: true,
				amount:1,
				size2:4.0
			}

	badTVPass.uniforms[ "distortion" ].value = badTVParams.distortion;
			badTVPass.uniforms[ "distortion2" ].value = badTVParams.distortion2;
			badTVPass.uniforms[ "speed" ].value = badTVParams.speed;
			badTVPass.uniforms[ "rollSpeed" ].value = badTVParams.rollSpeed;

			staticPass.uniforms[ "amount" ].value = staticParams.amount;
			staticPass.uniforms[ "size" ].value = staticParams.size2;
			

	var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
    var width = window.innerWidth, height = window.innerHeight;
    renderTarget = new THREE.WebGLRenderTarget( width, height, renderTargetParameters  );

	composer = new THREE.EffectComposer( renderer, renderTarget);

	composer.addPass( renderPass );
	composer.addPass (vignettePass);
	composer.addPass( copyPass );
	//set last pass in composer chain to renderToScreen
	copyPass.renderToScreen = true;
}

function changePostProcessing() {
	composer = new THREE.EffectComposer( renderer, renderTarget);
	composer.addPass( renderPass );
	composer.addPass (vignettePass);
	if (mode === 1) {
		composer.addPass( kaleidoPass );
		composer.addPass(filmPass);
	} else if (mode === 2) {
		composer.addPass(mirrorPass);
		composer.addPass(RGBShiftPass);
	} else if (mode === 3) {
		composer.addPass(badTVPass);
		composer.addPass(RGBShiftPass);
	} else if (mode === 4) {
		composer.addPass(dotScreenPass);
		composer.addPass(RGBShiftPass);
	} else if (mode === 5) {
		composer.addPass(filmPass);
	} else if (mode === 6) {
		composer.addPass(kaleidoPass);
		composer.addPass(mirrorPass);
		composer.addPass(badTVPass);
	}

	// composer.addPass(horizontalBlurPass);
	// composer.addPass(filmPass);
	// composer.addPass(mirrorPass);
	// composer.addPass(dotScreenPass);
	// composer.addPass(RGBShiftPass);
	// composer.addPass( badTVPass );
	// composer.addPass( staticPass );
	composer.addPass( copyPass );
	//set last pass in composer chain to renderToScreen
	copyPass.renderToScreen = true;
}

function setupVideo() {
	v = document.createElement('video');
	v.src = 'beast.ogv';
	v.autoplay = true;
	v.loop = true;
	v.muted = true;

	v.addEventListener("loadedmetadata", vidLoaded, false);
}

function setupVHS() {
	vhsv = document.createElement('video');
	vhsv.src = 'vhs.webm';
	vhsv.autoplay = true;
	vhsv.loop = true;
	vhsv.muted = true;

	vhsv.addEventListener("loadedmetadata", vhsLoaded, false);
}

function init() {
	setupStats();

	winWidth = window.innerWidth;
	winHeight = window.innerHeight;
    renderer.setSize(winWidth/1, winHeight/1);
    // renderer.autoClearColor = false;
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    setupScene();
    setupPostProcessing();
    setupVideo();
    setupVHS();

    initUserMedia();
}

function vidLoaded() {
	ratio = v.videoHeight / v.videoWidth;
	vHeight = winWidth * ratio;
	v.width = winWidth;
	v.height = vHeight;

	createCanvas();
}

function vhsLoaded() {
	vhsratio = vhsv.videoHeight / vhsv.videoWidth;
	vhsvHeight = winWidth * vhsratio;
	vhsv.width = winWidth;
	vhsv.height = vhsvHeight;

	createVhsCanvas();
}

function createCanvas() {
	c = document.createElement('canvas');
	ctx = c.getContext('2d');
	c.width = winWidth;
	c.height = winHeight;
	c.style.position = 'absolute';
	c.style.top = 0;
	c.style.left = 0;
	c.style.zIndex = 0;

	document.body.appendChild(c);

	c2 = document.createElement('canvas');
	ctx2 = c2.getContext('2d');
	c2Width = Math.floor(winWidth / 4);
	c2Height = (winWidth / 4) * ratio;
	c2.width = c2Width;
	c2.height = c2Height;

	render();
}

function createVhsCanvas() {
	vhsc = document.createElement('canvas');
	vhsctx = vhsc.getContext('2d');
	vhsc.width = winWidth;
	vhsc.height = winHeight;
	vhsc.style.position = 'absolute';
	vhsc.style.top = 0;
	vhsc.style.left = 0;
	vhsc.style.zIndex = 1;
	vhsc.id = "vhs";

	document.body.appendChild(vhsc);

}

function initUserMedia() {
	navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	
	navigator.getUserMedia_({
		audio: true
	}, startaudio, function(err) {
	    console.log(err);
	});
	analyser.smoothingTimeConstant = 0.6;
}

function startaudio(stream) {
	var mediaStreamSource = context.createMediaStreamSource(stream);
	mediaStreamSource.connect(analyser);
    mediaStreamSource.connect(volume);

	var data = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(data);
}

function render() {
	stats.begin();

    requestAnimationFrame(render);

    FFTData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(FFTData);
    var compute = Math.abs(FFTData[0]) / 10 ;
    var computeHigh = Math.abs(FFTData[512]) / 10;
    if(geometryMode === 1) {
    	sphere.visible = true;
    	cube.visible = true;
    	particleSystem.visible = true;
    	if(compute < 6) {
	        sphere.scale.set(compute, compute, compute);
	    }
	    camera.position.x = sphere.position.x + 5 * Math.cos( .7 * clock.getElapsedTime() );         
	    camera.position.z = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
	    camera.position.y = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
	    camera.lookAt( cube.position );
	    cube.rotation.x += 0.2 / (compute);
	    particleSystem.rotation.z += 0.01;	
    }else{
    	sphere.visible = false;
    	cube.visible = false;
    	particleSystem.visible = false;
    	camera.position.y = 10;
    	camera.position.z -= .8;
    	camera.rotation.z +=.005;
    	camera.rotation.y +=.002;
    	camera.rotation.x +=.002;
    }
    
    /*var test = compute/5 *0xFF | 0;
    var grayscale = (test << 16) | (test << 8) | test;
    if(compute < 4) {
        renderer.setClearColor( grayscale , 0.7 );
    } else {
        renderer.setClearColor( 0x000000 , 0 );
    }*/

    if(Math.ceil(clock.getElapsedTime()) % 20 === 0) {
    	if(Math.ceil(clock.getElapsedTime()) != currentSecond) {
    		currentSecond = Math.ceil(clock.getElapsedTime());
    		geometryMode = Math.ceil(Math.random()*2);
    		document.getElementsByClassName('text-holder')[0].children[Math.floor(Math.random()*2)].style.display = "block";
    	}
    }else if (Math.ceil(clock.getElapsedTime()- 10)  % 20 === 0) {
    	document.getElementsByClassName('text-holder')[0].children[0].style.display = "none";
    	document.getElementsByClassName('text-holder')[0].children[1].style.display = "none";
    }

    if(compute < 8) {
    	mode = Math.ceil(Math.random()*7);
    	changePostProcessing();
    }

    if(computeHigh < 6 ) {
    	vhsc.style.opacity = 0.5;
    }else {
    	vhsc.style.opacity = 0;
    }

    threshold(Math.exp(compute*1.3));
    ctx.drawImage(c2, 0, 0, winWidth, vHeight);
    vhsctx.drawImage(vhsv, 0, 0, winWidth, vHeight);

	//renderer.render(scene, camera);
	renderer.clear();
	renderer.clearColor();
	composer.render(0.1);
	stats.end();
}

function threshold(t) {
	var pixelData = getPixelData();
	var pixelDataLen = pixelData.data.length;
	for (var i = 0; i < pixelDataLen; i += 4 ) {
		// Get the RGB values for this pixel
		var r = pixelData.data[i];
		var g = pixelData.data[i+1];
		var b = pixelData.data[i+2];
		// Compare each pixel's greyscale value to the threshold value...
		var value = (0.2126 * r + 0.7152 * g + 0.0722 * b >= t) ? 255 : 0;
		// ...and set the colour based on the result
		pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = value;
	}
	// Draw the data on the visible canvas
	ctx2.putImageData(pixelData, 0, 0);
}

function getPixelData() {
	// Draw the video onto the backing canvas
	ctx2.drawImage(v, 0, 0, c2Width, c2Height);
	// Grab the pixel data and work on that directly
	return ctx2.getImageData(0, 0, c2Width, c2Height);
}

init();