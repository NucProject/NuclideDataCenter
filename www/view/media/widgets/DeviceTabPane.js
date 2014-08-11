
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

    _items: null,

    PageCount: 100,

    __constructor: function() {
    },

    getPageEvent: function() {
        return this.widgetId() + "-pager";
    },

    onAttach: function(domNode) {
        var dataPane = domNode.find("div.data-pane")

        this._dataListView = new ListView();
        var dataListViewDomNode = this._dataListView.create();
        dataListViewDomNode.appendTo(dataPane);

        $('<div class="pagebar"></div>').appendTo(dataPane.parent());

        this._alertListView = new ListView();
        var alertListViewDomNode = this._alertListView.create();
        alertListViewDomNode.appendTo(domNode.find("div.alert-pane"));

        var this_ = this;
        this._alertListView.setHeaders([
            {'key':'id', 'type': 'id'},
            {'key':'time', 'name':'时间'},
            {'key':'field', 'name':'报警字段'},
            {'key':'value', 'name':'报警值'},
            {'key':'handle', 'name':'处理'},

        ]);

        $('body').bind('transfer-selected-time', function(event, startTime, endTime) {
            this_.dateRangeChanged && this_.dateRangeChanged(startTime, endTime);
        });

        var self = this;
        if (!this._noAlertData)
        {
            this.ajax("alert/config/" + this._deviceType, null, function(data){
                var fc = eval("(" + data + ")");

                self._alertSettingPane = new SettingPane(self._deviceType);
                var dn = self._alertSettingPane.create();

                dn.appendTo(self._domNode.find('div.config'));
                self._alertSettingPane.setAlertFields(fc['results'])

            });
        }

        this._alertListView._domNode.delegate('td a.handle', 'click', function(){
            var a = $(this);
            var tr = a.parent().parent();
            var id = tr.attr('data-id');
            self.handleAlert(self._deviceType, id, tr, a.siblings('input').val() )
        });

        // Tab Item Changed!
        domNode.find('ul.nav-tabs li').delegate('a', 'click', function(){
            var tabItem = $(this);
            setTimeout(function(){self.postOnTabChanged(tabItem);}, 200);
        });
    },

    handleAlert: function(deviceType, id, tr, content) {
        console.log(deviceType, id, content);
        this.ajax("alert/handle", {'device': deviceType, 'id': id, 'comment': content}, function(data){
            $r = eval("(" + data + ")");
            if ($r.errorCode == 0) {
                tr.find('td').css('background-color', 'yellow');
                setTimeout(function(){
                    tr.slideUp();
                }, 500);
            }

        })
    },

    updatePageBar: function(items) {
        var pageBarContainer = this._domNode.find('div.pagebar');
        pageBarContainer.empty();

        if (this._pageBar)
        {
            this.unbindEvent(this, this.getPageEvent());
        }

        this._pageBar = new Pagebar(Math.floor(items.length / this.PageCount) + 1);
        this._pageBar.create().appendTo(pageBarContainer);
        this._pageBar.setPageEvent(this, this.getPageEvent());
        var this_ = this;
        this.bindEvent(this, this.getPageEvent(), function(e, sender, data){
            this_.fillList( this_._items, data - 1);
        });
    },

    fetchData: function(payload) {

        if (this._currentShownDevice != this._deviceType)
            return;

        var this_ = this;
        var currentStationId = g.getCurrentStationId();

        if (currentStationId)
        {
            var api = "data/fetch/" + currentStationId + "/" + this._deviceType;

            this.ajax(api, payload, function(data){
                $r = eval("(" + data + ")");

                console.log($r);

                var items = $r.results.items;
                this_._items = items;
                this_.makeDataDict(items);
                // console.log("44445", this._dict['15:55:00'])
                this_.fillList(items, 0);
                this_.updatePageBar(items)
            });
        }
    },

    fillList: function(items, page) {
        var from = page * this.PageCount;
        var to = (page + 1) * this.PageCount;
        d = new Date()
        var base = -3600 * 8 * 1000;
        var value = null;
        var start = false;
        var count = 0;
        var params = this._dataListView.clearValues();

        var keys = Object.keys(this._dict);
        keys.sort().reverse();
        for (var i in keys) {

            if (count >= from) {
                start = true;
            }

            var key = keys[i];
            value = this._dict[key];
            if (value)
            {
                count += 1;
                if (start)
                {
                    console.log(111)
                    this._dataListView.addValue(value, params);
                }
            }

            if (count > to)
                break;
        }

        for (var i = 2880; i >= 0; i -= 1) {

            d.setTime(base + i * 30000)
            s = d.toTimeString()
            var key = s.substr(0, 8);

            if (count >= from) {
                start = true;
            }

            value = this._dict[key];
            if (value)
            {
                count += 1;
                if (start)
                {
                    console.log(111)
                    this._dataListView.addValue(value, params);
                }
            }


            if (count > to)
                break;
        }
    },

    fetchAlerts: function() {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/alerts/" + currentStationId + "/" + this._deviceType;
            this._alertListView.refresh(api);
        }
    },

    onShow: function()
    {
        this._currentShownDevice = this._deviceType;
        console.log("On Show: " + this._currentShownDevice);
        var payload = {
            start: g.getBeginTime().toString('yyyy-MM-dd'),
            end: g.getEndTime().toString('yyyy-MM-dd')
        };
        this.fetchData(payload);

        if (!this._noAlertData)
        {
            this.fetchAlerts();
        }
    },


    showCharts: function(domNode, p) {
        console.log(111);
        if (p.filter)
        {
            var items = p.filter(this._items);
        }

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
                categories: p.x || items.x //??
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
                    lineWidth:1,
                    fillOpacity: 0.1,
                    dataLabels: {
                        enabled: false
                    },
                    marker: {
                        enabled: true,
                        states: {
                            hover: {
                                enabled: false,
                                radius: 1
                            }
                        }
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

    dateRangeChanged: function(range) {
        console.log('data changed');
        this.fetchData({start: range.start, end: range.end});
    },

    makeDataDict: function(items) {
        var dict = [];
        for (var i in items) {
            var item = items[i];
            var t = item['time'].split(' ')[1];
            dict[t] = item;
        }
        this._dict = dict;
        return this._dict;
    },

    filterData: function(data, field) {

        var datas = [];
        var times = [];
        var p = 0;

        var dict = [];
        for (var i in data) {
            var t = data[i]['time'].split(' ')[1];
            dict[t] = data[i][field];
        }


        d = new Date()
        var base = -3600 * 8 * 1000;
        var value = null;
        var start = false;
        for (var i = 0; i < 2880; i += 1) {

            d.setTime(base + i * 30000)
            s = d.toTimeString()
            var key = s.substr(0, 8);

            //.if (i % 2 != 0)
            //    continue;

            value = dict[key];
            if (value)
            {
                start = true
                datas.push(parseFloat(value));
            }
            else
            {
                if (start)
                {
                    datas.push(null);
                }
            }

            if (start)
            {
                if (i % 100 == 0)
                {
                    times.push(key.substr(0, 5));
                }
                else
                {
                    times.push('');
                }
            }

        }
        console.log(datas)
        return {'data': datas, 'x': times};
    },

    postOnTabChanged: function(tabItem) {


        if (tabItem.hasClass('history')) {
            this.onDataStatisitcTabShown();
        } else if (tabItem.hasClass('charts')) {
            this.showChartsTab && this.showChartsTab();
        }

        // Device
        this.onTabChanged && this.onTabChanged(tabItem);
    },

    onDataStatisitcTabShown: function() {
        if (!this._calendarPane) {
            this._calendarPane = new HistoryPane();
            var r = this._calendarPane.create();
            r.appendTo(this._domNode.find("div.calendar-container"));

        }
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
            filter: kx.bind(this, 'filter')
        });

    },

    filter: function(data) {
        return this.filterData(data, 'doserate');
    },

    onTabChanged: function() {

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
            filter: kx.bind(this, 'filter1')
        });

        this.showCharts(this._domNode, {
            selector: "div.charts2",
            title: "气压", ytitle: "气压",
            filter: kx.bind(this, 'filter2')
        });

    },

    filter1: function(data) {
        return this.filterData(data, 'Temperature');

    },

    filter2: function(data) {
        return this.filterData(data, 'Pressure');
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



