import * as three from "three"
import {WEBVR} from "../src/webvr"

new three.DaydreamController()

WEBVR.checkAvailability().catch(function(message) {
  document.body.appendChild(WEBVR.getMessageContainer(message))
})
var clock = new three.Clock()
var container
var camera, scene, ray, raycaster, renderer
var gamepad
var room
var intersected

init()
animate()
function init() {
  container = document.createElement("div")
  document.body.appendChild(container)
  var info = document.createElement("div")
  info.style.position = "absolute"
  info.style.top = "10px"
  info.style.width = "100%"
  info.style.textAlign = "center"
  info.innerHTML =
    '<a href="https://threejs.org" target="_blank" rel="noopener">three.js</a> webvr - daydream'
  container.appendChild(info)
  scene = new three.Scene()
  scene.background = new three.Color(0x505050)
  camera = new three.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    10,
  )
  room = new three.Mesh(
    new three.BoxGeometry(6, 6, 6, 8, 8, 8),
    new three.MeshBasicMaterial({color: 0x808080, wireframe: true}),
  )
  scene.add(room)
  scene.add(new three.HemisphereLight(0x606060, 0x404040))
  var light = new three.DirectionalLight(0xffffff)
  light.position.set(1, 1, 1).normalize()
  scene.add(light)
  var geometry = new three.BoxGeometry(0.15, 0.15, 0.15)
  for (var i = 0; i < 200; i++) {
    var object = new three.Mesh(
      geometry,
      new three.MeshLambertMaterial({color: Math.random() * 0xffffff}),
    )
    object.position.x = Math.random() * 4 - 2
    object.position.y = Math.random() * 4 - 2
    object.position.z = Math.random() * 4 - 2
    object.rotation.x = Math.random() * 2 * Math.PI
    object.rotation.y = Math.random() * 2 * Math.PI
    object.rotation.z = Math.random() * 2 * Math.PI
    object.scale.x = Math.random() + 0.5
    object.scale.y = Math.random() + 0.5
    object.scale.z = Math.random() + 0.5
    object.userData.velocity = new three.Vector3()
    object.userData.velocity.x = Math.random() * 0.01 - 0.005
    object.userData.velocity.y = Math.random() * 0.01 - 0.005
    object.userData.velocity.z = Math.random() * 0.01 - 0.005
    room.add(object)
  }

  raycaster = new three.Raycaster()

  renderer = new three.WebGLRenderer({antialias: true})
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.sortObjects = false
  container.appendChild(renderer.domElement)
  renderer.vr.enabled = true

  WEBVR.getVRDisplay(function(device) {
    renderer.vr.setDevice(device)
    document.body.appendChild(WEBVR.getButton(device, renderer.domElement))
  })

  gamepad = new three.DaydreamController()
  gamepad.position.set(0.25, -0.5, 0)
  scene.add(gamepad)

  var gamepadHelper = new three.Line(
    new three.BufferGeometry(),
    new three.LineBasicMaterial({linewidth: 4}),
  )
  gamepadHelper.geometry.addAttribute(
    "position",
    new three.Float32BufferAttribute([0, 0, 0, 0, 0, -10], 3),
  )
  gamepad.add(gamepadHelper)
  renderer.domElement.addEventListener("click", function(event) {
    gamepadHelper.material.color.setHex(Math.random() * 0xffffff)
  })

  window.addEventListener("resize", onWindowResize, false)
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  renderer.animate(render)
}
function render() {
  gamepad.update()
  var delta = clock.getDelta() * 60
  // find intersections
  raycaster.ray.origin.copy(gamepad.position)
  scene.add()
  raycaster.ray.direction.set(0, 0, -1).applyQuaternion(gamepad.quaternion)
  var intersects = raycaster.intersectObjects(room.children)
  if (intersects.length > 0) {
    if (intersected != intersects[0].object) {
      if (intersected)
        intersected.material.emissive.setHex(intersected.currentHex)
      intersected = intersects[0].object
      intersected.currentHex = intersected.material.emissive.getHex()
      intersected.material.emissive.setHex(0xff0000)
    }
  } else {
    if (intersected)
      intersected.material.emissive.setHex(intersected.currentHex)
    intersected = undefined
  }
  // keep cubes inside room
  for (const cube in room.children) {
    for (let dim = 0; dim < cube.position.length; dim++) {
      cube.rotation[dim] += cube.userData.velocity[dim] * 2 * delta

      const pos = cube.position[dim]
      if (Math.abs(pos) > 3) {
        cube.position[dim] = Math.clamp(pos, -3, 3)
        cube.userData.velocity[dim] *= -1
      }
    }
  }
  renderer.render(scene, camera)
}
