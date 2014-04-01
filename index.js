var scene 			= new THREE.Scene(),
	camera 			= new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	renderer 		= new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true}),
    clock 			= new THREE.Clock(),
    sphereGeometry 	= new THREE.IcosahedronGeometry( 2, 2 ),
    cubeGeometry 	= new THREE.CubeGeometry( 1, 1, 1 ),
    material 		= new THREE.MeshBasicMaterial({color: 0xcccccc, wireframe:true}),
    sphere 			= new THREE.Mesh(sphereGeometry, material),
    cube 			= new THREE.Mesh(cubeGeometry, material);
	particleCount 	= 1800,
    particles 		= new THREE.Geometry(),
    pMaterial 		= new THREE.ParticleBasicMaterial({
						color: 0xFFFFFF,
						size: 1
					}),
    particleSystem 	= null,
	context 		= new webkitAudioContext(),
	analyser 		= context.createAnalyser(),
	volume 			= context.createGain(),
	iterator		= 0;
    //renderTarget, effectSave, effectBlend, composer;

var c, ctx, c2, ctx2, v, winWidth, winHeight, vHeight, c2Width, c2Height, ratio, animation;


function init() {
	winWidth = window.innerWidth;
	winHeight = window.innerHeight;
    renderer.setSize(winWidth/1, winHeight/1);
    renderer.autoClearColor = false;
    document.body.appendChild(renderer.domElement);
    
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

	v = document.createElement('video');
	v.src = 'beast.ogv';
	v.autoplay = true;
	v.loop = true;
	v.muted = true;

	v.addEventListener("loadedmetadata", vidLoaded, false);

    //renderer.autoClear = false;

    /*var renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
    var width = window.innerWidth, height = window.innerHeight;
    renderTarget = new THREE.WebGLRenderTarget( width, height, renderTargetParameters  ); //, 

    effectSave = new THREE.SavePass( new THREE.WebGLRenderTarget( width, height, renderTargetParameters ) ); //, renderTargetParameters

    effectBlend = new THREE.ShaderPass( THREE.BlendShader, "tDiffuse1" );

    effectBlend.uniforms[ 'tDiffuse2' ].value = effectSave.renderTarget;
    effectBlend.uniforms[ 'mixRatio' ].value = 0.7;

    composer = new THREE.EffectComposer( renderer, renderTarget );

    var renderModel = new THREE.RenderPass( scene, camera );

    var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );

    effectVignette.uniforms[ "offset" ].value = 1.05;
    effectVignette.uniforms[ "darkness" ].value = 0.8;

    effectVignette.renderToScreen = true;

    composer.addPass( renderModel );

    composer.addPass( effectBlend );
    composer.addPass( effectSave );
    composer.addPass( effectVignette );

    renderer.clear();*/
    initUserMedia();
}

function vidLoaded() {
	ratio = v.videoHeight / v.videoWidth;
	vHeight = winWidth * ratio;
	v.width = winWidth;
	v.height = vHeight;

	createCanvas();
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
	iterator++;
    /*renderer.clear();
    composer.render(0.1);*/
    requestAnimationFrame(render);
    FFTData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(FFTData);
    var compute = Math.abs(FFTData[0]) / 10 ;
    if(compute < 6) {
        sphere.scale.set(compute, compute, compute);
    }
    if(iterator % Math.floor(compute) === 0 || iterator % Math.floor(compute/2) === 0) {
    	renderer.clear();
    }
    camera.position.x = sphere.position.x + 5 * Math.cos( .7 * clock.getElapsedTime() );         
    camera.position.z = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
    camera.position.y = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
    camera.lookAt( cube.position );
    cube.rotation.x += 0.2 / (compute);
    /*var test = compute/5 *0xFF | 0;
    var grayscale = (test << 16) | (test << 8) | test;
    if(compute < 4) {
        renderer.setClearColor( grayscale , 0.7 );
    } else {
        renderer.setClearColor( 0x000000 , 0 );
    }*/

    particleSystem.rotation.z += 0.01;
    threshold(Math.exp(compute*1.3));
    //ctx.drawImage(v, 0, 0, winWidth, vHeight);
    ctx.drawImage(c2, 0, 0, winWidth, vHeight);

	renderer.render(scene, camera);
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