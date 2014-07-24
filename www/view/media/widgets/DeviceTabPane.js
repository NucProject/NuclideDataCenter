
//////////////////////////////////////////////////////////////////////////
// Device Table Pane
$class("DeviceTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{

	__constructor: function(secret) {

    },

	onAttach: function(domNode) {

        kx.activeWeb(domNode);

	}

});
//////////////////////////////////////////////////////////////////////////
// Devices Base
$class("DeviceBase", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _dataListView: null,

    _alertListView: null,

    __constructor: function() {
    },

    onAttach: function(domNode) {
        this._dataListView = new ListView();
        var dataListViewDomNode = this._dataListView.create();
        dataListViewDomNode.appendTo(domNode.find("div.data-pane"));

        this._alertListView = new ListView();
        var alertListViewDomNode = this._alertListView.create();
        alertListViewDomNode.appendTo(domNode.find("div.alert-pane"));

        var this_ = this;
        domNode.find('ul.nav-tabs').delegate('a', 'click', function(){
            var display = $($(this).attr('href')).find('div.charts').css('display');
            if (display == 'block') {
                this_.showChartsTab && this_.showChartsTab();
            }
        });


        this._alertListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'field', 'name':'报警字段'},
            {'key':'value', 'name':'报警值'},
            {'key':'handle', 'name':'处理'},

        ]);

        $('body').bind('dateRangeChanged', function(event, startTime, endTime){
            this_.dateRangeChanged && this_.dateRangeChanged(startTime.toString('yyyy-MM-dd'), endTime.toString('yyyy-MM-dd'));
        });

        // TODO: Set Config items;

        this._alertListView._domNode.delegate('td a.handle', 'click', function(){

        });
    },

    fetchData: function(payload) {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/fetch/" + currentStationId + "/" + this._deviceType;
            this._dataListView.refresh(api, payload);
        }
    },

    fetchAlerts: function() {
        var currentStationId = g.getCurrentStationId();
        console.log(33335);
        if (currentStationId)
        {
            console.log(333);
            var api = "data/alerts/" + currentStationId + "/" + this._deviceType;
            this._alertListView.refresh(api);
        }
    },

    onShow: function()
    {
        this.fetchData();
        if (!this._noAlertData)
        {
            this.fetchAlerts();
        }
    },


    showCharts: function(domNode, p) {

        if (p.filter)
        {
            var items = this._dataListView.getShownData();
            var items = p.filter(items);
        }

        console.log(items);
        console.log(items.data);

        var selector = p.selector || 'div.charts';
        domNode.find(selector).highcharts({
            chart: {
                type: 'line'
            },
            title: {
                text: p.title
            },
            subtitle: {
                text: p.subtitle
            },
            xAxis: {
                categories: p.x //??
            },
            yAxis: {
                title: {
                    text: p.ytitle
                }
            },
            tooltip: {
                enabled: true,
                formatter: function() {

                    if (p.tooltips)
                    {
                        return p.tooltips(this.x, this.y);
                    }
                    return '<b>'+ this.series.name +'</b><br>'+this.x +': '+ this.y;
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: false
                    },
                    enableMouseTracking: true
                }
            },
            series: [{
                name: p.title,
                data: items.data
            }
            /*, {
                name: 'London',
                data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
            }*/]
        });

    },

    dateRangeChanged: function(startTime, endTime) {
        this.fetchData({start: startTime, end: endTime});
    }


});

//////////////////////////////////////////////////////////////////////////
// Devices
$class("HpicDevice", DeviceBase,
{
	__constructor: function() {
        this._deviceType = "hpic";
	},

    onAttach: function(domNode) {
        console.log(domNode)
        this.__super(DeviceBase.prototype.onAttach, [domNode]);


        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'剂量率'},
            {'key':'battery', 'name':'电池'},
            {'key':'highvoltage', 'name':'电压'},
            {'key':'temperature', 'name':'温度'}]);

    },

    showChartsTab: function() {

        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率", ytitle: "剂量率",
            filter: this.filter
        });

    },

    filter: function(data) {
        var a = [];


        for (var i in data) {
            var n = data[i]['doserate'];
            a.push(parseFloat(n));
        }
        console.log(a)
        return {'data':a};
    }

});

$class("WeatherDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "weather";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Raingauge', 'name':'雨量'},
            {'key':'Humidity', 'name':'湿度'},
            {'key':'Pressure', 'name':'气压'},
            {'key':'Temperature', 'name':'温度'}]);
    },

    showChartsTab: function() {

        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "温度", ytitle: "温度",
            filter: this.filter1
        });

        this.showCharts(this._domNode, {
            selector: "div.charts2",
            title: "气压", ytitle: "气压",
            filter: this.filter2
        });

    },

    filter1: function(data) {
        var a = [];


        for (var i in data) {
            var n = data[i]['Temperature'];
            a.push(parseFloat(n));
        }

        return {'data':a};
    },

    filter2: function(data) {
        var a = [];
        for (var i in data) {
            var n = data[i]['Pressure'];
            a.push(parseFloat(n));
        }

        return {'data':a};
    }
});

$class("HpgeDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "hpge";
        this._noAlertData = true;
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'sid', 'name':'采样ID'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'path', 'name':'下载', 'type': 'url'}]);
    }
});

$class("LabrDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "labr";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'总剂量率'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key': 'refnuclidefound', 'name':"发现核素"},
            {'key':'N42path', 'name':'链接', 'type': 'url'}]
        );
    },

    showChartsTab: function() {

        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率", ytitle: "剂量率",
            filter: this.filter
        });
    },

    filter: function(data) {
        var a = [];


        for (var i in data) {
            var n = data[i]['doserate'];
            a.push(parseFloat(n));
        }
        console.log(a)
        return {'data':a};
    }
});


$class("CinderellaDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "cinderelladata";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Sid', 'name':'采样ID'},
            {'key':'barcode', 'name':'条 码'},
            {'key':'BeginTime', 'name':'开始时间'},
            {'key':'Flow', 'name':"流量"},
            {'key':'FlowPerHour', 'name':'瞬时流量'},
            {'key':'Pressure', 'name':'气压'}]);

    }
});


$class("EnvironmentDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "environment";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Temperature', 'name':'温度'},
            {'key':'Humidity', 'name':'湿度'},
            {'key':'BatteryHours', 'name':'电池时间'},
            {'key':'IfMainPowerOff', 'name':"电源"},
            {'key':'IfSmoke', 'name':'烟感'},
            {'key':'IfDoorOpen', 'name':'门禁'}]);

    }


});



