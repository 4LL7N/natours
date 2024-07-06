/*eslint-disable*/
// console.log('hello from the client side');
const mapBox = document.getElementById('map')

if(mapBox){

const loc = JSON.parse(mapBox.dataset.locations)



var map = L.map('map',{scrollWheelZoom: false}).setView([loc[0].coordinates[1],loc[0].coordinates[0]], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);



loc.forEach(element => {
  let marker = L.marker([element.coordinates[1],element.coordinates[0]]).bindPopup(`<h1>Day ${element.day}: ${element.description}</h1>`).openPopup().addTo(map);  
  // L.popup().setLatLng([element.coordinates[1],element.coordinates[0]]).setContent(`Day ${element.day}: ${element.description}`).openOn(map)
  // marker.; // this pops up when you click
});
}
