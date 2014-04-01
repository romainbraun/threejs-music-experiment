var scene 			= new THREE.Scene(),
	camera 			= new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	renderer 		= new THREE.WebGLRenderer(),
    clock 			= new THREE.Clock(),
    sphereGeometry 	= new THREE.IcosahedronGeometry( 2, 2 ),
    cubeGeometry 	= new THREE.CubeGeometry( 1, 1, 1 ),
    material 		= new THREE.MeshBasicMaterial({color: 0xdddddd, wireframe:true}),
    sphere 			= new THREE.Mesh(sphereGeometry, material),
    cube 			= new THREE.Mesh(cubeGeometry, material);
	particleCount = 1800,
    particles = new THREE.Geometry(),
    pMaterial = new THREE.ParticleBasicMaterial({
      color: 0xFFFFFF,
      size: 20
    }),
	context 		= new webkitAudioContext(),
	analyser 		= context.createAnalyser(),
	volume 			= context.createGain();
    //renderTarget, effectSave, effectBlend, composer;




function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
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
		    particle = new THREE.Vertex(
		    	new THREE.Vector3(pX, pY, pZ)
		    );

		// add it to the geometry
		particles.vertices.push(particle);
	}

	var particleSystem = new THREE.ParticleSystem(
	    particles,
	    pMaterial);

	// add it to the scene
	scene.add(particleSystem);

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

function initUserMedia() {
	navigator.getUserMedia_ = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	
	navigator.getUserMedia_({
		audio: true
	}, startaudio, function(err) {
	    console.log(err);
	});
	analyser.smoothingTimeConstant = 0.6;
	render();
}

function startaudio(stream) {
	var mediaStreamSource = context.createMediaStreamSource(stream);
	mediaStreamSource.connect(analyser);
    mediaStreamSource.connect(volume);

	var data = new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(data);
}

function render() {
    /*renderer.clear();
    composer.render(0.1);*/
    requestAnimationFrame(render);

    FFTData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(FFTData);
    var compute = Math.abs(FFTData[0]) / 10 ;
    if(compute < 6) {
        sphere.scale.set(compute, compute, compute);
    }
    camera.position.x = sphere.position.x + 5 * Math.cos( .7 * clock.getElapsedTime() );         
    camera.position.z = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
    camera.position.y = sphere.position.z + 5 * Math.sin( .7 * clock.getElapsedTime() );
    camera.lookAt( cube.position );
    cube.rotation.x += 0.2 / (compute);
    var test = compute/5 *0xFF | 0;
    var grayscale = (test << 16) | (test << 8) | test;
    if(compute < 4) {
        renderer.setClearColorHex( grayscale , 1 );
    } else {
        renderer.setClearColorHex( 0x000000 , 1 );
    }

	renderer.render(scene, camera);
}

init();