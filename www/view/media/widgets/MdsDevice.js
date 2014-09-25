/**
* Created by Healer on 14-9-9.
*
*
*/

$class("MdsSummaryDevice", DeviceSummaryBase,
{
    __constructor: function() {

    },

    onAttach: function(domNode) {
        this._deviceType = "mds";
        this.onAttached(domNode);
    },

    onSettingPaneShow: function(fieldConfig)
    {
        console.log(fieldConfig);
        for (var i in fieldConfig)
        {
            console.log(i, fieldConfig[i]);
        }
    },

    changeAlertClicked: function()
    {
        var url = "alert/set/" + g.getCurrentStationId() + "/mds";
        var payload = { "f": "doserate", "v1": 100, "v2": 150, "r": 1};
        this.ajax(url, payload, function(data){
            console.log(data)
        });
        return false;
    }

});


$class("MdsDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "mds";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'sid', 'name':'巡测ID'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'lat', 'name':'经度', 'type': 'str'},
            {'key':'lon', 'name':'纬度', 'type': 'str'},
            {'key':'speed', 'name':'速度'},
            {'key':'height', 'name':'高度'},
            //{'key':'map', 'name':'map'},    //????
            {'key':'doserateex', 'name':'扩展剂量率'},
            {'key':'ifatificial', 'name':'是否发现人工核素'}]);

        this.createSummaryList(domNode);
    },

    createSummaryList: function(domNode) {
        var sumContainer = domNode.find('div.sum-container');
        this._sumListView = new ListView();
        var dataListViewDomNode = this._sumListView.create();
        dataListViewDomNode.appendTo(sumContainer);

        var this_ = this;

        sumContainer.delegate('a', 'click', function(){
            this_.showGisMap($(this));
            return false;
        });

        var listNode = this._domNode.find('#mds_statisic div.sum-container');
        var gisNode = this._domNode.find('#mds_statisic div.gis');
        this._domNode.find('#mds_statisic div.gis').delegate('a', 'click', function(){
            listNode.slideDown();
            gisNode.hide();
        });

        this._sumListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'sid', 'name': '巡测ID', 'type': 'link'},
            {'key':'begintime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'doserateex', 'name':'扩展剂量率'}]);
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    showChartsTab: function() {
        console.log(111)
        this._chartInterval = 30 * 10000;
        this.updateCharts();
    },

    showGisMap: function(sender) {
        var this_ = this
        // Map Container
        var divId = "ID_" + new Date();

        this._domNode.find('#mds_statisic div.sum-container').slideUp();
        this._domNode.find('#mds_statisic div.gis').css('display', '')
            .find('div').attr('id', divId).css('height', 400);

        // Map about
        var yy = 22.26859500;   // Lat
        var xx = 113.52092000;  // Lon
        var gpsPoint = new BMap.Point(xx, yy);


        // Map
        var bm = new BMap.Map(divId);
        bm.centerAndZoom(gpsPoint, 15);
        bm.addControl(new BMap.NavigationControl());

        //添加谷歌marker和label
        var markergps = new BMap.Marker(gpsPoint);
        bm.addOverlay(markergps); //添加GPS标注
        var labelgps = new BMap.Label("巡测起点",{offset:new BMap.Size(0, -0)});
        markergps.setLabel(labelgps); //添加GPS标注

        //坐标转换完之后的回调函数
        translateCallback = function (point){
            var marker = new BMap.Marker(point);
            bm.addOverlay(marker);
            var label = new BMap.Label("路线起点",{offset:new BMap.Size(0, -0)});
            marker.setLabel(label); //添加百度label
            bm.setCenter(point);
            // alert(point.lng + "," + point.lat);
        }

        /*
        return false;
        setTimeout(function(){
            BMap.Convertor.translate(gpsPoint, 0, translateCallback);     //真实经纬度转成百度坐标
            return false;
        }, 2000);
        */

        //地图路线初始化
        var sid = sender.text();
        this.ajax('data/mds/' + g.getCurrentStationId() + "/" + sid, null, function(data){
            var d = eval('(' + data + ')');
            if (d['errorCode'] == 0)
            {
                var items = d['results']['items'];
                this_.addPolyline(bm, items);
            }

            return false;
        });

        return false;
    },

    addPolyline: function(map, items) {
        var array = [];
        var llon = 0, llat = 0;
        for (var i in items) {
            var item = items[i];
            var lon = item['lon'];
            var lat = item['lat'];
            if (lon == llon && lat == llat)
                continue;
            array.push(new BMap.Point(lon, lat));

            llon = lon;
            llat = lat;
        }

        console.log(array)
        var polyline = new BMap.Polyline(array, {strokeColor:"red", strokeWeight:2, strokeOpacity:0.5});

        map.addOverlay(polyline);
        return false;
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var fieldItem = this._domNode.find('select.chart-field');
        console.log(fieldItem);
        var title = fieldItem.find('option:selected').text();
        var field = fieldItem.val();
        var min = fieldItem.attr('min');
        var max = fieldItem.attr('max');

        var interval =  this._chartInterval || 30 * 10000;
        this.showCharts(this._domNode,
            {
                selector: "div.charts",
                title: title,
                ytitle: title,
                start: start,
                end: end,
                max:150,
                min:40,
                interval: interval,
                filter: kx.bind(this, 'filter')
            }
        );
    },

    filter: function(data) {
        var currentField = this._domNode.find('select.chart-field').val();
        return this.chartFilterData(data, currentField, this._chartInterval);
    },

    onTabChanged: function() {

    },

    onSummaryShow: function() {
        var this_ = this;
        this.ajax('data/mdsSummary/' + g.getCurrentStationId(), null, function(data)
        {
            console.log(data)
            var r = eval("(" + data + ")");
            var items = r['results']['items'];
            this_.updateSummaryList(items);
        });
    },

    updateSummaryList: function(items) {
        var params = this._sumListView.clearValues();
        for (var i in items) {
            var item = items[i];
            this._sumListView.addValue(item, params);
        }
    },

    onIntervalChanged: function(sender) {
    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    }


});
