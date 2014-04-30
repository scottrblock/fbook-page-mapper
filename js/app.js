//fbook page object has many like objects
//like objects have count, location (geocode?)

window.fbAsyncInit = function() {
  FB.init({
    appId      : '1486141328265840',
    cookie     : true, // enable cookies to allow the server to access the session
    status     : true,
    xfbml      : true
  });

  FB.Event.subscribe('auth.authResponseChange', function(response) {
    if (response.status === 'connected') {
      App.initiatePageMapper();
    } else if (response.status === 'not_authorized') {
      FB.login(function(){}, {scope: 'read_insights'});
    } else {
      FB.login(function(){}, {scope: 'read_insights'});
    }
  });
};



var App = function () {
  return {
    map_bubbles : [],

    map: new Datamap({
      element: document.getElementById("world-map"),
      geographyConfig: {
        popupOnHover: false,
        highlightOnHover: false
      },

      fills: {
        defaultFill: '#18BC9C',
        bubbleFill:  '#2C3E50'
      }
    }),

    getFacebookId: function ($input) {
      $input.attr('disabled', 'disabled');

      var input_val = $input.val();

      FB.api('/' + input_val + '/insights/page_fans_city', function(response) {
        console.log(response);
      });

      return false;
    },

    addFormWarning: function($form) {
      var $wrapper = $form.closest('.form-wrapper');
      $wrapper.addClass("has-warning has-feedback");
    },

    appendPageList: function(page_name, page_id){
        var page_list_item_html = "<li>";
                page_list_item_html += "<a href='#' class='one-page'";
                page_list_item_html += "data-page-id='" + page_id + "'";
                page_list_item_html += ">" + page_name + "</a>";
            page_list_item_html += "</li>";
      $("#page-list").append(page_list_item_html);            
    },

    initiatePageMapper: function() {
      FB.api('/me/accounts', function(response) {
        
        //TODO if response.data.length === 0, error message

        _.each(response.data, function(page, e){
          var page_name = page.name;
          var page_id = page.id;

          App.appendPageList(page_name, page_id);
        });

      });
    },

    geoCodeCity: function(city){
      var geocoder =  new google.maps.Geocoder();
      geocoder.geocode( { 'address': city.city_name}, function(results, status) {
        
        var geocoded = null;
        if (status == google.maps.GeocoderStatus.OK) {
          geocoded = {lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()}
        }

        App.populateMap(geocoded, city.scaled_population, city);
      });
    },

    populateMap: function(geocoded, scaled_population, original_city){
      var city_obj = new Object();
      city_obj.fillKey = 'bubbleFill';

      if ( geocoded !== null ){
        city_obj.latitude = geocoded.lat;
        city_obj.longitude = geocoded.lng;
        city_obj.radius = scaled_population; 
        city_obj.population = original_city.population;
        city_obj.name = original_city.city_name;
      } else{ 
        console.error("city null");
      }

      App.map_bubbles.push(city_obj);
      App.map.bubbles(App.map_bubbles, {
        popupTemplate: function (geo, data) { 
          return '<div class="hoverinfo"> <h4>' +  data.name + '</h4>Likes: ' +  App.commaFormatted(data.population) + ' people';
        }
      });
    },

    commaFormatted: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
}();


$(document).ready(function(){
  (function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "//connect.facebook.net/en_US/all.js";
   fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  // $("#fbook-id-entry").submit(function(i, e){
  //   var $form = $(this);
  //   $input = $("#fbook-id", $form);
  //   var $btn = $('#fbook-id-submit', $form);
  //   $btn.button('loading');

  //   var fbook_id = App.getFacebookId($input);

  //   console.log(fbook_id);
  //   console.log($input);
  //   if(fbook_id === false){
  //    // App.addFormWarning($form);
  //   }
   
  //   return false;
  // });

  $("#fbook-login").click(function(i, e){
    FB.login(function(){}, {scope: 'read_insights,manage_pages'});
    return false;
  });

  $('#page-list').on("click", ".one-page", function(){
    var page_id = $(this).attr('data-page-id');
    FB.api('/' + page_id + '/insights/page_fans_city', function(response) {

      //TODO clear old map

      var city_data = response.data[0].values[0].value;
      var all_city_arr = [];

      _.each(city_data, function(population, city_name){
        all_city_arr.push({population: population, city_name: city_name});
      });
      
      var all_city_arr = _.sortBy(all_city_arr, function(city) {
          return city.population * -1;
      });

      var truncated_cities = all_city_arr.slice(0, 7);

      var min_max = d3.extent(truncated_cities, function(d){ return d.population })
      var linearScale = d3.scale.linear()
                          .domain( [ min_max[0], min_max[1] ] )
                          .range( [25, 100] );

      _.each(truncated_cities, function(city, i){
        city.scaled_population = linearScale(city.population);
      });

      _.each(truncated_cities, function(city, e){
        var geocoded = App.geoCodeCity(city);
      });


    });
  

    return false;
  });

});

















