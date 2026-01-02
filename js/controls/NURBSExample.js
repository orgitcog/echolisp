// NURBS surface

				var nsControlPoints = [
					[
						new THREE.Vector4 ( -200, -200, 100, 1 ),
						new THREE.Vector4 ( -200, -100, -200, 1 ),
						new THREE.Vector4 ( -200, 100, 250, 1 ),
						new THREE.Vector4 ( -200, 200, -100, 1 )
					],
					[
						new THREE.Vector4 ( 0, -200, 0, 1 ),
						new THREE.Vector4 ( 0, -100, -100, 5 ),
						new THREE.Vector4 ( 0, 100, 150, 5 ),
						new THREE.Vector4 ( 0, 200, 0, 1 )
					],
					[
						new THREE.Vector4 ( 200, -200, -100, 1 ),
						new THREE.Vector4 ( 200, -100, 200, 1 ),
						new THREE.Vector4 ( 200, 100, -250, 1 ),
						new THREE.Vector4 ( 200, 200, 100, 1 )
					]
				];
				var degree1 = 2;
				var degree2 = 3;
				var knots1 = [0, 0, 0, 1, 1, 1];
				var knots2 = [0, 0, 0, 0, 1, 1, 1, 1];
				var nurbsSurface = new THREE.NURBSSurface(degree1, degree2, knots1, knots2, nsControlPoints);

				var map = new THREE.TextureLoader().load( 'textures/UV_Grid_Sm.jpg' );
				map.wrapS = map.wrapT = THREE.RepeatWrapping;
				map.anisotropy = 16;

				getSurfacePoint = function(u, v) {
					return nurbsSurface.getPoint(u, v);
				};

				var geometry = new THREE.ParametricGeometry( getSurfacePoint, 20, 20 );
				var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );
				var object = new THREE.Mesh( geometry, material );
				object.position.set( - 200, 100, 0 );
				object.scale.multiplyScalar( 1 );
				group.add( object );