const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const skill = urlParams.get('skill')
const pages = urlParams.get('page')
var config = {
  geojson: "http://209.145.62.164:8000/get_request_peoplexskill?parameters="+skill+"|"+pages,
  title: "Torre Map Dashboard",
  layerName: "Users",
  hoverProperty: "name",
  sortProperty: "name",
  sortOrder: "desc"
};


var properties = [{
  value: "id",
  label: "ID",
  table: {
    visible: false
  },
  filter: {
    type: "string"
  }
}, 
{
  value: "verified",
  label: "Verified",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string",
    input: "checkbox",
    vertical: true,
    multiple: true,
    operators: ["in", "not_in", "equal", "not_equal"],
    values: []
  }
},
  
{
  value: "weight",
  label: "Weight",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "integer"
  }
},
{
  value: "Lat",
  label: "latitud",
  table: {
    visible: false,
    sortable: true
  },
  filter: {
    type: "integer"
  }
},
{
  value: "Long",
  label: "longitud",
  table: {
    visible: false,
    sortable: true
  },
  filter: {
    type: "integer"
  }
},

{
  value: "name",
  label: "Name",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  }
},
{
  value: "locationName",
  label: "City/Country",
  table: {
    visible: true
  },
  filter: {
    type: "string"
  }
},
{
  value: "openTo",
  label: "Open to",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  }
},


{
  value: "picture",
  label: "picture",
  table: {
    visible: false,
    sortable: true
  },
  filter: {
    type: "string"
  }
},  
{
  value: "compensations",
  label: "Compensations",
  table: {
    visible: false
  },
  filter: {
    type: "string"
  }
},
{
  value: "created",
  label: "Created Account",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "date"
  }
},

];

function drawCharts() {
  // Created vs Weight Chart
  $(function() {
     
    var resul = alasql("SELECT created AS fecha, weight AS name FROM ?", [features]);
    
    var columns_date = $.map(resul, function(created) {
      return [created.fecha];
    }); 

    var columns_dato = $.map(resul, function(magnitudes) {
      return [magnitudes.name];
    });
    columns_date.unshift('x')
    columns_dato.unshift('Users')

    var chart = c3.generate({
        bindto: "#status-chart",
        data: {
          x: 'x', 
          xFormat: '%Y-%m-%d %H:%M:%S',
          columns: [columns_date,columns_dato],
          labels: true
        },
        axis: {
            x: {
                type: 'timeseries',
                localtime: false,
                tick: {
                    format: '%y-%m-%d'
                }
            }
        }
    });
  });

  // User Verified Chart
  $(function() {
    var result = alasql("SELECT verified AS label, COUNT(*) AS total FROM ? GROUP BY verified", [features]);
    var columns = $.map(result, function(verified) {
      return [[verified.label, verified.total]];
    });
    var chart = c3.generate({
        bindto: "#zone-chart",
        data: {
          type: "pie",
          columns: columns,
          labels: true
        }
    });
  });

  // Compensations Chart
  $(function() {
    var sizes = [];
    var regeneration = alasql("SELECT 'Alaska/North America' AS category, COUNT(*) AS total FROM ? WHERE CAST(Long as FLOAT) < -81", [features]);
    var sapling = alasql("SELECT 'Latin America' AS category, COUNT(*) AS total FROM ? WHERE CAST(Long as FLOAT) BETWEEN -81 AND -34", [features]);
    var small = alasql("SELECT 'Europa/Africa/Emiratos' AS category, COUNT(*) AS total FROM ? WHERE CAST(Long as FLOAT) BETWEEN -34 AND 50", [features]);
    var medium = alasql("SELECT 'Asia/Indonesia/Australia' AS category, COUNT(*) AS total FROM ? WHERE CAST(Long as FLOAT) BETWEEN 50 AND 129", [features]);
    var large = alasql("SELECT 'Japon/New Zeland' AS category, COUNT(*) AS total FROM ? WHERE CAST(Long as FLOAT) > 129", [features]);
    sizes.push(regeneration, sapling, small, medium, large);
    var columns = $.map(sizes, function(size) {
      return [[size[0].category, size[0].total]];
    });
    var chart = c3.generate({
        bindto: "#size-chart",
        data: {
          type: "pie",
          columns: columns,
          labels: true
        }
    });
  });

  // Count of OpenTo Chart
  $(function() {
    var result = alasql("SELECT openTo AS label, COUNT(*) AS total FROM ? GROUP BY openTo ORDER BY label ASC", [features]);
    var chart = c3.generate({
        bindto: "#species-chart",
        size: {
          height: 300
        },title: {
          text: 'For the use of a lot of information you can use the mouse scroll to zoom to the bars.'
        },
        data: {
          json: result,
          keys: {
            x: "label",
            value: ["total"]
          },
          type: "bar",
          labels: true
        },
        zoom: {
          enabled: true,
          extent: [1, 5] // enable more zooming
        },
        axis: {
          rotated: true, 
          x: {
            type: "category", 
          } 
        },
        legend: {
          show: true
        }
    });
  });
}

$(function() {
  $(".title").html(config.title);
  $("#layer-name").html(config.layerName);
});

function buildConfig() {
  filters = [];
  table = [{
    field: "action",
    title: "<i class='fa fa-gear' ></i>&nbsp;Action",
    align: "center",
    valign: "middle",
    width: "75px",
    cardVisible: false,
    switchable: false,
    formatter: function(value, row, index) {
      return [
        '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">',
          '<i class="fa fa-search-plus"  style="color: #CDDB49"></i>',
        '</a>',
        '<a class="identify" href="javascript:void(0)" title="Identify">',
          '<i class="fa fa-info-circle"  style="color: #CDDB49"></i>',
        '</a>'
      ].join("");
    },
    events: {
      "click .zoom": function (e, value, row, index) {
        map.fitBounds(featureLayer.getLayer(row.leaflet_stamp).getBounds());
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      },
      "click .identify": function (e, value, row, index) {
        identifyFeature(row.leaflet_stamp);
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      }
    }
  }];



  $.each(properties, function(index, value) {
    // Filter config
    if (value.filter) {
      var id;
      if (value.filter.type == "integer") {
        id = "cast(properties->"+ value.value +" as int)";
      }
      else if (value.filter.type == "double") {
        id = "cast(properties->"+ value.value +" as double)";
      }
      else {
        id = "properties->" + value.value;
      }
      filters.push({
        id: id,
        label: value.label
      });
      $.each(value.filter, function(key, val) {
        if (filters[index]) {
          // If values array is empty, fetch all distinct values
          if (key == "values" && val.length === 0) {
            alasql("SELECT DISTINCT(properties->"+value.value+") AS field FROM ? ORDER BY field ASC", [geojson.features], function(results){
              distinctValues = [];
              $.each(results, function(index, value) {
                distinctValues.push(value.field);
              });
            });
            filters[index].values = distinctValues;
          } else {
            filters[index][key] = val;
          }
        }
      });
    }
    // Table config
    if (value.table) {
      table.push({
        field: value.value,
        title: value.label
      });
      $.each(value.table, function(key, val) {
        if (table[index+1]) {
          table[index+1][key] = val;
        }
      });
    }
  });

  buildFilters();
  buildTable();
}
 

var GoogleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{  attribution: '&copy; Google Maps - Satellite',   maxZoom: 20,    subdomains:['mt0','mt1','mt2','mt3'] });
var GoogleHyb = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{  attribution: '&copy; Google Maps - Hibrido',   maxZoom: 20,    subdomains:['mt0','mt1','mt2','mt3']});
var GoogleMaps = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{  attribution: '&copy; Google Maps',   maxZoom: 20,    subdomains:['mt0','mt1','mt2','mt3']});
 var EsriMap= L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; ESRI Maps',  maxZoom: 18,   });
var EsriGRAY= L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; ESRI Maps',  maxZoom: 18,   });
var OSM = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contribuitors'});
var omniscale = L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {  attribution: '&copy; 2021 &middot; <a href="https://maps.omniscale.com/">Omniscale</a> ' +
'&middot; Map data: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
var highlightLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 15,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: "#CDDB49",
      fillOpacity: 1,
      clickable: false
    });
  },
  style: function (feature) {
    return {
      color: "#CDDB49",
      weight: 2,
      opacity: 1,
      fillColor: "#CDDB49",
      fillOpacity: 0.5,
      clickable: false
    };
  }
});

var featureLayer = L.geoJson(null, {
  filter: function(feature, layer) {
    return feature.geometry.coordinates[0] !== 0 && feature.geometry.coordinates[1] !== 0;
  },
  /*style: function (feature) {
    return {
      color: feature.properties.color
    };
  },*/
  pointToLayer: function (feature, latlng) {
    if (feature.properties && feature.properties["marker-color"]) {
      markerColor = feature.properties["marker-color"];
    } else {
      markerColor = "#CDDB49";
    }
    return L.circleMarker(latlng, {
      radius: 6,
      weight: 3,
      fillColor: markerColor,
      color: markerColor,
      opacity: 1,
      fillOpacity: 1
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          identifyFeature(L.stamp(layer));
          highlightLayer.clearLayers();
          highlightLayer.addData(featureLayer.getLayer(L.stamp(layer)).toGeoJSON());
        },
        mouseover: function (e) {
          if (config.hoverProperty) { 
            $(".info-control").html('<img src="'+feature.properties['picture']+'" height="100px" width="100px" class="circular--square"><br>'+feature.properties[config.hoverProperty]);
            $(".info-control").show();
          }
        },
        mouseout: function (e) {
          $(".info-control").hide();
        }
      });
    }
  }
});

// Fetch the GeoJSON file
$.getJSON(config.geojson, function (data) {
  geojson = data;
  if(geojson.features.length==0){
    alert('Sorry there is no data for this query, Try with a skill :c')
    $("#loading-mask").hide();
    window.location.href = "index.html"
  }else{
    features = $.map(geojson.features, function(feature) {
      return feature.properties;
    });
    featureLayer.addData(data);
    buildConfig();
    $("#loading-mask").hide();
  }
  
});

var map = L.map("map", {
  layers: [EsriGRAY, featureLayer, highlightLayer]
}).fitWorld();

// ESRI geocoder
var searchControl = L.esri.Geocoding.Controls.geosearch({
  useMapBounds: 17
}).addTo(map);

// Info control
var info = L.control({
  position: "bottomleft"
});

// Custom info hover control
info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info-control");
  this.update();
  return this._div;
};
info.update = function (props) {
  this._div.innerHTML = "";
};
info.addTo(map);
$(".info-control").hide();

// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
  isCollapsed = true;
} else {
  isCollapsed = false;
}
var baseLayers = {
  "Google Hibrido": GoogleHyb,
  "Google Maps": GoogleMaps,
  "Esri Gray Dark":EsriGRAY
};
var overlayLayers = {
  "<span id='layer-name'>GeoJSON Layer</span>": featureLayer
};
var layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: isCollapsed
}).addTo(map);

// Filter table to only show features in current map bounds
map.on("moveend", function (e) {
  syncTable();
});

map.on("click", function(e) {
  highlightLayer.clearLayers();
});
var t = L.terminator({fillOpacity: 0.4});
t.addTo(map);
setInterval(function(){updateTerminator(t)}, 500);
function updateTerminator(t) {
  t.setTime();
}
// Table formatter to make links clickable
function urlFormatter (value, row, index) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return "<a href='"+value+"' target='_blank'>"+value+"</a>";
  }
}

function buildFilters() {
  $("#query-builder").queryBuilder({
    allow_empty: true,
    filters: filters
  });
}

function applyFilter() {
  var query = "SELECT * FROM ?";
  var sql = $("#query-builder").queryBuilder("getSQL", false, false).sql;
  if (sql.length > 0) {
    query += " WHERE " + sql;
  }
  alasql(query, [geojson.features], function(features){
        featureLayer.clearLayers();
        featureLayer.addData(features);
        syncTable();
    });
}

function buildTable() {
  $("#table").bootstrapTable({
    cache: false,
    height: $("#table-container").height(),
    undefinedText: "",
    striped: false,
    pagination: false,
    minimumCountColumns: 1,
    sortName: config.sortProperty,
    sortOrder: config.sortOrder,
    toolbar: "#toolbar",
    search: true,
    trimOnSearch: false,
    showColumns: true,
    showToggle: true,
    columns: table,
    onClickRow: function (row) {
      // do something!
    },
    onDblClickRow: function (row) {
      // do something!
    }
  });

  map.fitBounds(featureLayer.getBounds());

  $(window).resize(function () {
    $("#table").bootstrapTable("resetView", {
      height: $("#table-container").height()
    });
  });
}

function syncTable() {
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    if (map.hasLayer(featureLayer)) {
      if (map.getBounds().contains(layer.getBounds())) {
        tableFeatures.push(layer.feature.properties);
      }
    }
  });
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features.");
  }
}

function identifyFeature(id) {
  var featureProperties = featureLayer.getLayer(id).feature.properties;
  var content = "<table id='tableinfo' class='table table-striped table-bordered table-condensed'>";
  $.each(featureProperties, function(key, value) {
    if (!value) {
      value = "";
    }
    if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
      value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
    }
    $.each(properties, function(index, property) {
      if (key == property.value) {
        if (property.info !== false) {          
          if(property.value == 'openTo'){
            var opento=value.toString().split(',')
            var badges=""
            for (let index = 0; index < opento.length; index++) {
              badges+='<span  class="badge badge-pill badge-success" style="background-color:#518EF2">'+opento[index]+'</span>';              
            }
            content += '<tr><th>Open To</th><td style="text-align:center">'+badges+'</td></tr>';
          }else if(property.label == 'picture'){            
              content += '<tr><th>picture</th><td style="text-align:center"><img src="'+value.split('\'')[1]+'" height="100px" width="100px" class="circular--square"></td></tr>';
          }else if(property.value == 'compensations'){            
            content += '<tr><th>Compensations</th><td style="text-align:center">';
            
            if(value.hasOwnProperty('freelancer')){
              content +='<i>Freelancer</i>: '+value['freelancer']['currency']+value['freelancer']['amount']+'/<i>'+value['freelancer']['periodicity']+'</i>'+'<br>'
            }
            if(value.hasOwnProperty('employee')){
              content +='<i>Employee</i>: '+value['employee']['currency']+value['employee']['amount']+'/<i>'+value['employee']['periodicity']+'</i>'+'<br>'
            }
            if(value.hasOwnProperty('intern')){
              content +='<i>Intern</i>: '+value['intern']['currency']+value['intern']['amount']+'/<i>'+value['intern']['periodicity']+'</i>'        
            }
              
            content +='</td></tr>';
          }else{
            content += '<tr><th>' + property.label + '</th><td style="text-align:center">' + value + '</td></tr>';
          }
        }
      }
    });
  });

  content += '<tr><th></th><td style="text-align:center"><button class="btn btn-lg btn-secondary"><i class="fa fa-user"></i> Signal</button></td></tr>';
  content += "</table>";
  $("#feature-info").html(content);
  $("#featureModal").modal("show");
}

function switchView(view) {
  if (view == "split") {
    $("#view").html("Split View");
    location.hash = "#split";
    $("#table-container").show();
    $("#table-container").css("height", "55%");
    $("#map-container").show();
    $("#map-container").css("height", "45%");
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
    $("#map-container").hide();
    $(window).resize();
  }
}

$("[name='view']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    switchView("split");
    return false;
  } else if (this.id === "map-only") {
    switchView("map");
    return false;
  } else if (this.id === "graph-only") {
    switchView("table");
    return false;
  }
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#filter-btn").click(function() {
  $("#filterModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chart-btn").click(function() {
  $("#chartModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#view-sql-btn").click(function() {
  alert($("#query-builder").queryBuilder("getSQL", false, false).sql);
});

$("#apply-filter-btn").click(function() {
  applyFilter();
});

$("#reset-filter-btn").click(function() {
  $("#query-builder").queryBuilder("reset");
  applyFilter();
});

$("#extent-btn").click(function() {
  map.fitBounds(featureLayer.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-csv-btn").click(function() {
  $("#table").tableExport({
    type: "csv",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-excel-btn").click(function() {
  $("#table").tableExport({
    type: "excel",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-pdf-btn").click(function() {
  $("#table").tableExport({
    type: "pdf",
    ignoreColumn: [0],
    fileName: "data",
    jspdf: {
      format: "bestfit",
      margins: {
        left: 20,
        right: 10,
        top: 20,
        bottom: 20
      },
      autotable: {
        extendWidth: false,
        overflow: "linebreak"
      }
    }
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chartModal").on("shown.bs.modal", function (e) {
  drawCharts();
});

// add location control to global name space for testing only
// on a production site, omit the "lc = "!
lc = L.control.locate({
  strings: {
      title: "Show me where I am!"
  }
}).addTo(map);
