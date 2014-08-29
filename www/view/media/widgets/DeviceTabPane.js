
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

        this.initIntervalChange(domNode.find('div.interval'));
    },

    initIntervalChange: function(domNode) {
        if (!domNode.hasClass('interval'))
            return false;
        var this_ = this;
        domNode.delegate('a', 'click', function(){
            var sender = $(this);

            sender.siblings().removeClass('red');
            sender.addClass('red');

            this_.onIntervalChanged && this_.onIntervalChanged($(this));

            this_.shiftIntervalView(sender, 0);
        });
    },

    shiftIntervalView: function(sender, page) {
        if (sender.hasClass('m5')) {
            this.fillList5min(page);
        } else if (sender.hasClass('s30')) {
            this.fillList(page);
        } else if (sender.hasClass('h1')) {
            this.fillList1Hour(page);
        } else {
            this.fillListDefault(page);
        }
    },

    handleAlert: function(deviceType, id, tr, content) {
        console.log(deviceType, id, content);
        this.ajax("alert/handle", {'device': deviceType, 'id': id, 'comment': content}, function(data) {
            $r = eval("(" + data + ")");
            if ($r.errorCode == 0) {
                tr.find('td').css('background-color', 'yellow');
                setTimeout(function(){
                    tr.slideUp();
                }, 500);
            }
        })
    },

    updatePageBar: function(itemsCount) {
        var pageBarContainer = this._domNode.find('div.pagebar');
        pageBarContainer.empty();

        if (this._pageBar)
        {
            this.unbindEvent(this, this.getPageEvent());
        }

        this._pageBar = new Pagebar(Math.floor(itemsCount / this.PageCount) + 1);
        this._pageBar.create().appendTo(pageBarContainer);
        this._pageBar.setPageEvent(this, this.getPageEvent());
        var this_ = this;
        this.bindEvent(this, this.getPageEvent(), function(e, sender, data){

            var sender = this_._domNode.find('div.interval a.red');
            this_.shiftIntervalView(sender, data - 1);
        });
    },

    fetchAlerts: function() {
        var currentStationId = g.getCurrentStationId();
        if (currentStationId)
        {
            var api = "data/alerts/" + currentStationId + "/" + this._deviceType;
            this._alertListView.refresh(api);
        }
    },

    fetchData: function(payload)
    {
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

                this_.renderData();

            });
        }
    },

    renderData: function()
    {
        if (this._onChartsPage)
        {
            this.updateCharts();
        }
        else
        {
            this.fillList(0);
        }
    },

    onHide: function() {

    },

    // ---------------------------------------------------------
    // Widget.widgetById(this._deviceType + "-device").onShow();
    onShow: function()
    {
        this._currentShownDevice = this._deviceType;
        console.log("On Show: " + this._currentShownDevice);
        var payload = {
            start: g.getBeginTime('yyyy-MM-dd'),
            end: g.getEndTime('yyyy-MM-dd')
        };
        this.fetchData(payload);
    },

    fixValue: function(v) {
        for (var i in v) {
            if (i == 'time' || i == 'starttime' || i == 'endtime') {
                continue;
            }
            var f = parseFloat(v[i]);
            if (!isNaN(f))
                v[i] = f.toFixed(1);

        }
        return v;
    },

    fillList: function(page) {
        var from = page * this.PageCount;
        var to = (page + 1) * this.PageCount;
        d = new Date()

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
                    value = this.fixValue(value)
                    this._dataListView.addValue(value, params);
                }
            }

            if (count > to)
                break;
        }
        this.updatePageBar(keys.length)
        return;
    },

    fillList5min: function(page) {
        var from = page * this.PageCount;
        var to = (page + 1) * this.PageCount;
        d = new Date()

        var value = null;
        var start = false;
        var count = 0;
        var params = this._dataListView.clearValues();


        var keys = Object.keys(this._dict);
        keys.sort().reverse();
        var gv = null;
        for (var i in keys) {

            if (count >= from) {
                start = true;
            }

            if (!start)
                continue;

            var key = keys[i];
            var m = key.substr(4, 1);
            var s = key.substr(6, 2);

            value = this._dict[key];

            if ((m == '5' || m == '0') && s == '00') {
                if (gv) {
                    this._dataListView.addValue(gv.getValue(), params);
                }

                if (value['start'] != null) {
                    var startTime = value['starttime'];
                    var endTime = value['endtime'];
                    gv = new GroupValue({'time': key, 'startTime': startTime, 'endtime': endTime});
                } else  {
                    gv = new GroupValue({'time': key});
                }
            }

            gv && gv.addValue(value);

            if (count > to)
                break;
        }
        this.updatePageBar(keys.length / 10)
    },

    fillList1Hour: function() {

        var value = null;
        var start = false;
        var count = 0;
        var params = this._dataListView.clearValues();

        var keys = Object.keys(this._dict);
        keys.sort().reverse();
        var gv = null;
        for (var i in keys) {


            var key = keys[i];
            var m = key.substr(3, 2);
            var s = key.substr(6, 2);

            if (m == '00' && s == '00') {
                if (gv) {
                    this._dataListView.addValue(gv.getValue(), params);
                }

                gv = new GroupValue({'time': key});
            }

            value = this._dict[key];
            gv && gv.addValue(value);
        }

        if (gv) {
            this._dataListView.addValue(gv.getValue(), params);
        }

        this.updatePageBar(12)
    },

    showCharts: function(domNode, p) {

        if (p.filter)
        {
            var items = p.filter(this._items);
        }

        var selector = p.selector || 'div.charts';
        domNode.find(selector).css('width', '100%');
        domNode.find(selector).highcharts({
            chart: {
                type: 'line', zoomType: 'x'
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
                        enabled: false,
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
        var payload = {
            start: range.start.toString('yyyy-MM-dd'),
            end: range.end.toString('yyyy-MM-dd') };
        this.fetchData(payload);
    },

    makeDataDict: function(items) {
        var dict = [];
        for (var i in items) {
            var item = items[i];
            var t = item['time'];
            dict[t] = item;
        }
        this._dict = dict;
        return this._dict;
    },

    chartFilterData: function(data, field) {

        var datas = [];
        var times = [];
        var p = 0;

        var dict = [];

        var endTime = g.getEndTime().getTime();
        var beginTime = g.getBeginTime().getTime();

        var diff = endTime - beginTime;
        var multiDays = false;
        if (diff > 86400000) {
            multiDays = true;
            console.log(1111)
        }

        // Store in a dict~
        var item = null;
        for (var i in data) {
            item = data[i];
            var t = Date.parse(item['time']).getTime();
            dict[t] = item[field];
        }

        var d = new Date()
        var value = null;
        var start = false;

        var interval = 30000;
        var counter = 0;
        for (var i = beginTime; i < endTime; i += interval, counter += 1)
        {

            if (counter % 5 != 0) {
                continue;
            }

            value = dict[i];
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
                times.push('');
            }
                /*
                var hm = key.substr(0, 5);

                if (hm.substr(3, 5) == '00')
                {
                    times.push("a<br/>b");
                    // times.push(key.substr(0, 5));
                }
                else
                {
                    times.push('');
                }
            }
            */

        }
        console.log(datas)
        return {'data': datas, 'x': times};
    },

    postOnTabChanged: function(tabItem) {
        this._onChartsPage = false;

        if (tabItem.hasClass('history')) {
            this.onDataStatisitcTabShown();
        } else if (tabItem.hasClass('charts')) {
            this._onChartsPage = true;
            this.showChartsTab && this.showChartsTab();
        } else if (tabItem.hasClass('data')) {
            this.onShow();
        } else if (tabItem.hasClass('alerts')) {
            this.onAlertPageShow();
        }

        // Device
        this.onTabChanged && this.onTabChanged(tabItem);
    },

    onAlertPageShow: function() {
        console.log("onAlertPageShow")
        if (!this._noAlertData)
        {
            this.fetchAlerts();
        }
    },

    onDataStatisitcTabShown: function() {
        if (!this._calendarPane) {
            this._calendarPane = new HistoryPane(this._deviceType);
            var r = this._calendarPane.create();
            r.appendTo(this._domNode.find("div.calendar-container"));

        }
    }


});




