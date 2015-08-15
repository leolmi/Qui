/* Created by Leo on 15/08/2015. */
'use strict';

angular.module('quiApp')
  .factory('maps', [function() {
    function getOptions(G) {
      return {
        zoom: 14,
        center: new G.maps.LatLng(43.7681469,11.2527254),
        mapTypeId: G.maps.MapTypeId.ROADMAP
      };
    }

    /**
     * Genera la mappa
     * @param G
     * @param {function} center
     * @param {function} cb
     * @param {string} [dommap]
     * @param {string} [domfinder]
     * @param {object} [o]
     * @returns {context}
     */
    function createContext(G, center, cb, dommap, domfinder, o) {
      o = o || getOptions(G);
      cb = cb || angular.noop;
      dommap = dommap || 'map-canvas';
      domfinder = domfinder || 'map-finder';
      var context = {
        options: o,
        G:G,
        map: new G.maps.Map(document.getElementById(dommap), o),
        directionsService: new G.maps.DirectionsService,
        directionsDisplay: new G.maps.DirectionsRenderer,
        searchBox: {}
      };

      // Crea il box per la ricerca e lo sincronizza con la mappa
      var input = document.getElementById(domfinder);
      context.searchBox = new G.maps.places.SearchBox(input);
      context.map.controls[G.maps.ControlPosition.TOP_LEFT].push(input);
      context.directionsDisplay.setMap(context.map);
      context.map.addListener('bounds_changed', function() {
        context.searchBox.setBounds(context.map.getBounds());
      });
      context.searchBox.addListener('places_changed', function() {
        var places = context.searchBox.getPlaces();
        if (places.length == 0 || !center) return;
        center(places[0].geometry.location);
      });

      G.maps.event.addListenerOnce(context.map, 'idle', function(){
        cb(context);
      });
      return context;
    }

    /**
     * Informazioni per il calcolo del percorso
     * @param context
     * @param origin
     * @param destination
     * @param [waypts]
     * @param [mode]
     * @returns {{origin: *, destination: *, waypts: *, mode: *}}
     */
    function routeInfo(context, origin, destination, waypts, mode) {
      mode = mode || context.G.maps.TravelMode.DRIVING;
      if (typeof mode == 'string') {
        switch (mode){
          case 'walk': mode = context.G.maps.TravelMode.WALKING; break;
          case 'car': mode = context.G.maps.TravelMode.DRIVING; break;
          case 'public': mode = context.G.maps.TravelMode.TRANSIT; break;
          case 'bicycle': mode = context.G.maps.TravelMode.BICYCLING; break;
        }
      }
      waypts = waypts || [];
      return {
        origin:origin,
        destination:destination,
        waypts:waypts,
        mode:mode
      }
    }

    /**
     * Restituisce un latlng
     * @param G
     * @param pos
     * @returns {G.maps.LatLng}
     */
    function getLatLng(G, pos) {
      return new G.maps.LatLng((pos.latitude || pos.G), (pos.longitude || pos.K));
    }


    /**
     * Calcola il percorso
     * @param context
     * @param {routeInfo} info
     * @param [cb]
     */
    function calcRoute(context, info, cb) {
      cb = cb || angular.noop;
      context.directionsService.route({
        origin: getLatLng(context.G, info.origin),
        destination: getLatLng(context.G, info.destination),
        waypoints: info.waypts,
        optimizeWaypoints: true,
        travelMode: info.mode
      }, function(response, status) {
        if (status === context.G.maps.DirectionsStatus.OK) {
          context.route = response.routes[0];
          context.directionsDisplay.setDirections(response);
          return cb();
        } else {
          return cb('Directions request failed due to ' + status);
        }
      });
    }

    /**
     * Cancella il percorso calcolato
     * @param context
     */
    function clearRoute(context) {
      context.route = null;
      if (context.directionsDisplay)
        context.directionsDisplay.setMap(null);
      context.directionsDisplay = new context.G.maps.DirectionsRenderer;
      context.directionsDisplay.setMap(context.map);
    }

    function getRouteInfos(context){
      var infos = [];
      if (context.route && context.route.legs.length>0) {
        //route: {
        //  legs[{
        //    distance:{
        //      text: "162 km",
        //      value: 162340
        //    },
        //    duration:{
        //      text: "2 ore 2 min",
        //      value: 7316
        //    },
        //    end_address: 'indirizzo finale',
        //    start_address: 'indirizzo iniziale',
        //    steps: []
        //  }]
        //}
        var l = context.route.legs[0];
        infos.push({name: 'Da', value: l.start_address});
        infos.push({name: 'A', value: l.end_address});
        infos.push({separator: true});
        infos.push({name: 'Durata', value: l.duration.text});
        infos.push({name: 'Distanza', value: l.distance.text});
        //infos.push({separator: true});
        //l.steps.forEach(function (s, i) {
        //  infos.push({name: '' + (i + 1), value: l.distance.text + ' (' + s.duration.text + ') ' + s.instructions});
        //});
      }
      return infos;
    }

    return {
      getOptions:getOptions,
      createContext:createContext,
      routeInfo:routeInfo,
      calcRoute:calcRoute,
      clearRoute:clearRoute,
      getRouteInfos:getRouteInfos
    }
  }]);
