"use strict";

/*global THREE:                   false */
/*global document:                false */
/*global window:                  false */
/*global TWEEN:                   false */
/*global requestAnimationFrame:   false */
/*global Stats:                   false */


function BillBoardViewer() {
    var container,
        stats,
        camera,
        controls,
        scene,
        projector,
        renderer,
        vehicles = [],
        plane,
        billBoard,
        radar,
        label,
        sun,
        mouse = new THREE.Vector2(),
        offset = new THREE.Vector3(),
        INTERSECTED,
        SELECTED;

    function VideoPlayer() {
        var video,
            canvas,
            context,
            texture,
            playList,
            nowPlaying;

        playList = [
            "../videos/Cadburys_Smash_for_mash_get_smash_2.mp4",
            "../videos/Mercedes-Benz_TV-CLA_TV_commercial_Cat.ogv",
            "../videos/Cadburys_Smash_for_mash_get_smash_1.mp4",
            "../videos/sintel.ogv"
            //"videos/nodejs_bad_as_rock_star_tech.ogv"
        ];

        function makeMesh(height, width) {
            var material,
                geometry,
                mesh;

            canvas = document.createElement('canvas');

            canvas.height = height;
            canvas.width = width;

            context = canvas.getContext('2d');
            // background color if no video present
            context.fillStyle = '#0000FF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            material = new THREE.MeshBasicMaterial({
                map: texture,
                overdraw: true,
                side: THREE.DoubleSide
            });
            // The geometry on which the movie will be displayed;
            // movie image will be scaled to fit these dimensions.
            geometry = new THREE.PlaneGeometry(190, 95, 4, 4);
            //geometry = new THREE.SphereGeometry(100, 20, 20);

            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, 150);

            mesh.rotation.x = Math.PI / 2;
            mesh.rotation.y = Math.PI / 2;
            mesh.rotation.z = 0;
            mesh.rotation.y += 7 * Math.PI / 8;
            mesh.position.y = -190 - 6;
            mesh.position.x += -4;

            scene.add(mesh);
        }

        function onEnded(e) {
            if (!e) {
                e = window.event;
            }
            // What you want to do after the event
            console.log("Video ended.");
            nowPlaying = (nowPlaying + 1) % playList.length;
            video.src = playList[nowPlaying];
            video.load(); // Must call after setting/changing source
            video.play();
        }

        function onLoadedmetadata(e) {
            if (!e) {
                e = window.event;
            }
            console.log("Video height: ", video.videoHeight);
            console.log("Video width: ", video.videoWidth);
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
        }

        this.update = function videoPlayerUpdate() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                context.drawImage(video, 0, 0);
                if (texture) {
                    texture.needsUpdate = true;
                }
            } else {
                video.play();
            }
        };

        nowPlaying = 0;

        // Create the video element
        video = document.createElement('video');
        video.addEventListener('ended', onEnded, false);
        video.addEventListener('loadedmetadata', onLoadedmetadata, false);

        // video.id = 'video';
        // video.type = ' video/ogg; codecs="theora, vorbis" ';
        video.src = playList[nowPlaying];
        video.load(); // Must call after setting/changing source

        video.muted = false;
        video.play();

        //makeMesh(video.videoHeight, video.videoWidth);
        makeMesh(1000, 2000);
    }


    function BillBoard() {
        var pole,
            cabinet,
            videoPlayer;

        this.update = function () {
            videoPlayer.update();
        };

        // A pole for the billboard
        // API: THREE.CylinderGeometry(bottomRadius, topRadius, height, segmentsRadius, segmentsHeight)
        pole = new THREE.Mesh(new THREE.CylinderGeometry(10, 20, 190, 20, 20, false), new THREE.MeshPhongMaterial({
            color: 0x2a323e
        }));
        pole.overdraw = true;
        pole.castShadow = true;
        pole.rotation.x += Math.PI / 2;
        pole.position.x = 10;
        pole.position.y = -200 - 10;
        pole.position.z = 70;
        scene.add(pole);

        // A Box for the video screen on the billboard
        cabinet = new THREE.Mesh(new THREE.BoxGeometry(200, 10, 100), new THREE.MeshPhongMaterial({
            color: 0x2a323e
        }));
        cabinet.overdraw = true;
        cabinet.position.y = -200;
        cabinet.position.z = 150;
        cabinet.rotation.z += 3 * Math.PI / 8;
        cabinet.castShadow = true;
        scene.add(cabinet);

        videoPlayer = new VideoPlayer();
    }


    function Radar() {
        var field,
            fieldMaterial,
            control;
        // A radar field for the bill board
        // API: THREE.CylinderGeometry(bottomRadius, topRadius, height, segmentsRadius, segmentsHeight)
        fieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.2
        });
        field = new THREE.Mesh(new THREE.CylinderGeometry(10, 200, 1600, 20, 20, false), fieldMaterial);
        field.overdraw = true;
        field.rotation.x = -Math.PI / 8;
        field.rotation.z = -4.5 * Math.PI / 8;
        field.position.x = -800;
        field.position.y = -100;
        field.position.z = 150;
        scene.add(field);


        // FIXME attaching controls should not be specific to a radar
        control = new THREE.TransformControls(camera, renderer.domElement);
        //              control.addEventListener( 'change', render );
        control.attach(field);
        scene.add(control);
        window.addEventListener('keydown', function (event) {
            //console.log(event.which);
            switch (event.keyCode) {
            case 81: // Q
                control.setSpace(control.space === "local" ? "world" : "local");
                break;
            case 87: // W
                control.setMode("translate");
                break;
            case 69: // E
                control.setMode("rotate");
                break;
            case 82: // R
                control.setMode("scale");
                break;
            case 187:
            case 107: // +,=,num+
                control.setSize(control.size + 0.1);
                break;
            case 189:
            case 10: // -,_,num-
                control.setSize(Math.max(control.size - 0.1, 0.1));
                break;
            }
        });
    }


    function makeVehicles() {
        var geometry,
            vehicle,
            x,
            xc,
            xm;

        // Two vehicles drag racing...
        geometry = new THREE.BoxGeometry(80, 40, 30);
        vehicle = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xc8d3d1
        }));
        vehicle.material.ambient = vehicle.material.color;
        vehicle.position.x = -2000;
        vehicle.position.y = +40;
        vehicle.position.z = 25;
        vehicle.velocity = {
            x: 20,
            y: 1
        };
        vehicle.castShadow = true;
        vehicle.receiveShadow = true;
        scene.add(vehicle);
        vehicles.push(vehicle);

        vehicle = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0x613c4f
        }));
        vehicle.material.ambient = vehicle.material.color;
        vehicle.position.x = -2000;
        vehicle.position.y = -40;
        vehicle.position.z = +25;
        vehicle.velocity = {
            x: 17,
            y: 0
        };
        vehicle.castShadow = true;
        vehicle.receiveShadow = true;
        scene.add(vehicle);
        vehicles.push(vehicle);

        // The "42" label.
        x = document.createElement("canvas");
        xc = x.getContext("2d");
        x.width = 300;
        x.height = 150;
        xc.fillStyle = "#ff00aa";
        xc.font = "100pt arial bold";
        xc.textBaseline = "top";
        xc.fillText("42", 10, 0);
        xm = new THREE.MeshBasicMaterial({
            map: new THREE.Texture(x),
            //transparent: true     
            alphaTest: 0.9 // N.B. Used instead of transparent here to get transparent right!
        });
        xm.map.needsUpdate = true;
        xm.alphaTest = 0.9;

        label = new THREE.Mesh(new THREE.PlaneGeometry(300, 150, 2, 2), xm);
        label.position.set(0, 50, 0);
        label.doubleSided = true;
        label.updateMatrix();
        scene.add(label);
        label.lookAt(camera.position);
        label.scale.x = 0.5;
        label.scale.y = 0.5;

    }


    function makeSkyBox() {
        var urlPrefix,
            urls,
            geometry,
            texture,
            shader,
            material,
            skyBox;


        urlPrefix = "images/skybox/";
        urls = [ urlPrefix + "posx.png", urlPrefix + "negx.png",
              urlPrefix + "posy.png", urlPrefix + "negy.png",
              urlPrefix + "posz.png", urlPrefix + "negz.png" ];

        geometry = new THREE.CubeGeometry(10000, 10000, 10000);

        texture = THREE.ImageUtils.loadTextureCube(urls);
        shader = THREE.ShaderLib.cube;
        shader.uniforms.tCube.value = texture;
        material = new THREE.ShaderMaterial({
            fragmentShader : shader.fragmentShader,
            vertexShader : shader.vertexShader,
            uniforms: shader.uniforms,
            // depthWrite: false,
            side: THREE.BackSide
        });
        skyBox = new THREE.Mesh(geometry, material);
        scene.add(skyBox);
    }


    function makeSkySphere() {
        var geometry,
            uniforms,
            material,
            skySphere;

        geometry = new THREE.SphereGeometry(20000, 60, 40);

        uniforms = {
            texture: { type: 't', value: THREE.ImageUtils.loadTexture('images/Blue-sea-horizon.jpg') }
        };

        material = new THREE.ShaderMaterial({
            uniforms:       uniforms,
            vertexShader:   document.getElementById('sky-vertex').textContent,
            fragmentShader: document.getElementById('sky-fragment').textContent
        });

        skySphere = new THREE.Mesh(geometry, material);
        skySphere.scale.set(-1, 1, 1);
        skySphere.eulerOrder = 'YXZ';
        skySphere.renderDepth = 1000.0;
        skySphere.rotation.x += Math.PI / 2;
        scene.add(skySphere);
    }

    function makeFog() {
        scene.fog = new THREE.FogExp2(0xd0d0ff, 0.0007);
    }


    function makeGround() {
        var texture,
            material,
            geometry,
            ground;

        texture = new THREE.ImageUtils.loadTexture('images/checkerboard.jpg');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10);

        material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        geometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
        ground = new THREE.Mesh(geometry, material);

        ground.position.z = -50;
        scene.add(ground);
    }

    function makeHighway() {
        var geometry,
            road,
            sidewalk;

        // The road                
        geometry = new THREE.BoxGeometry(6000, 200, 20);
        road = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0x758388
        }));
        road.receiveShadow = true;
        scene.add(road);

        // The sidewalk                
        geometry = new THREE.BoxGeometry(6000, 500, 40);
        // Original colour was 0x94beb6 
        sidewalk = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xf4feef6
        }));
        sidewalk.position.z = -30;
        sidewalk.receiveShadow = true;
        scene.add(sidewalk);
    }


    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
        var raycaster,
            vector,
            intersects;
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        //
        vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);
        raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        if (SELECTED) {
            intersects = raycaster.intersectObject(plane);
            SELECTED.position.copy(intersects[0].point.sub(offset));
            return;
        }
        intersects = raycaster.intersectObjects(vehicles);
        if (intersects.length > 0) {
            if (INTERSECTED !== intersects[0].object) {
                if (INTERSECTED) {
                    INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
                }
                INTERSECTED = intersects[0].object;
                INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                plane.position.copy(INTERSECTED.position);
                plane.lookAt(camera.position);
            }
            container.style.cursor = 'pointer';
        } else {
            if (INTERSECTED) {
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            }
            INTERSECTED = null;
            container.style.cursor = 'auto';
        }
    }

    function onDocumentMouseDown(event) {
        var raycaster,
            vector,
            intersects;

        event.preventDefault();
        vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);
        raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
        intersects = raycaster.intersectObjects(vehicles);
        if (intersects.length > 0) {
            controls.enabled = false;
            // SELECTED = intersects[ 0 ].object;
            intersects = raycaster.intersectObject(plane);
            offset.copy(intersects[0].point).sub(plane.position);
            container.style.cursor = 'move';
        }
    }

    function onDocumentMouseUp(event) {
        event.preventDefault();
        controls.enabled = true;
        if (INTERSECTED) {
            plane.position.copy(INTERSECTED.position);
            SELECTED = null;
        }
        container.style.cursor = 'auto';
    }

    function jsLintUnused(v) {
        v = (v === undefined);
    }

    function makeCamera() {
        var tween;

        jsLintUnused(tween);

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 21000);
        camera.up.set(0, 0, 1);
        camera.lookAt(scene.position);
        camera.position.x = -300;
        camera.position.y = -180;
        camera.position.z = 150;

        tween = new TWEEN.Tween({
            x: -300,
            y: -180,
            z: 150
        }).to({
            x: +800,
            y: -300,
            z: 800
        }, 4000)
            .repeat(Infinity)
            .delay(2000)
            .yoyo(true)
            .easing(TWEEN.Easing.Cubic.InOut).onUpdate(function () {
                camera.position.x = this.x;
                camera.position.y = this.y;
                camera.position.z = this.z;
            }).start();
    }


    function makeSunshine() {
        var texture,
            material,
            light;

        scene.add(new THREE.AmbientLight(0x303030));

        light = new THREE.SpotLight(0x606060, 1.5);
        light.position.set(0, -2000, 4000);
        light.castShadow = true;
        light.shadowCameraNear = 200;
        light.shadowCameraFar = camera.far;
        light.shadowCameraFov = 50;
        light.shadowBias = -0.00022;
        light.shadowDarkness = 0.5;
        light.shadowMapWidth = 2048;
        light.shadowMapHeight = 2048;
        scene.add(light);


        texture = THREE.ImageUtils.loadTexture("images/sun.png");

        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });

        sun = new THREE.Mesh(new THREE.PlaneGeometry(128, 128, 2, 2), material);
        sun.position.set(0, -2000, 4000);
        sun.doubleSided = true;
        sun.updateMatrix();
        sun.lookAt(camera.position);
        sun.scale.x = 20.0;
        sun.scale.y = 20.0;
        scene.add(sun);
    }

    function makeInfo(text) {
        var info;

        info = document.createElement('div');
        info.style.position = 'absolute';
        info.style.top = '10px';
        info.style.width = '100%';
        info.style.textAlign = 'center';
        info.innerHTML = text;
        container.appendChild(info);
    }


    function makeStats() {
        // Frame rate statistics
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '10px';
        stats.domElement.style.left = '10px';
        container.appendChild(stats.domElement);
    }


    function init() {
        container = document.createElement('div');
        document.body.appendChild(container);

        scene = new THREE.Scene();

        makeCamera();

        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        makeSunshine();

        makeHighway();

        makeVehicles();


        plane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000, 8, 8), new THREE.MeshBasicMaterial({
            color: 0x000000,
            opacity: 0.25,
            transparent: true,
            wireframe: true,
            side: THREE.DoubleSide
        }));
        plane.visible = false;
        scene.add(plane);

        projector = new THREE.Projector();

        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setClearColor(0xe0e9fe);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.sortObjects = false;
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFShadowMap;
        container.appendChild(renderer.domElement);

        billBoard = new BillBoard();

        radar = new Radar();

        makeInfo('RSM MEDIA');

        makeStats();

        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

        window.addEventListener('resize', onWindowResize, false);
        // makeGround();
        // makeFog();
    }

    function render() {
        var i, x, y, z;
        for (i = 0; i < vehicles.length; i += 1) {
            x = vehicles[i].position.x;
            y = vehicles[i].position.y;
            z = vehicles[i].position.z;
            if (x > 1900) {
                x = -1900;
            } else {
                x += vehicles[i].velocity.x;
            }
            vehicles[i].position.x = x;
            vehicles[i].position.z = z;
            label.position.set(x, y, z + 100);
        }

        sun.lookAt(camera.position);
        sun.up.set(0, 0, 1);
        label.lookAt(camera.position);
        label.up.set(0, 0, 1);

        TWEEN.update();

        controls.update();
        camera.up.set(0, 0, 1);

        billBoard.update();

        renderer.render(scene, camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        stats.update();
    }

    init();
    animate();
    jsLintUnused(makeSkyBox, makeSkySphere, makeFog, makeGround, radar);
}

var b = new BillBoardViewer();

