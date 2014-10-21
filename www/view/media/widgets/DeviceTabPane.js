
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
// ZM: 所以有一个DeviceBase：就是因为所有设备的很多代码写出来是雷同的，不写个基类，那么重复代码太多了。
// 因为它们的很多行为是一样的，所以可以抽象出来一个基类。
// 比如说，它们都有列表，（基本）都有曲线，等等。处理数据基本是一致的，只有具体的差别。
$class("DeviceBase", [kx.Widget, Charts, kx.ActionMixin, kx.EventMixin],
{
    _dataListView: null,

    _alertListView: null,

    _items: null,

    PageCount: 100,

    __constructor: function() {
        // the date picker show today as default.
        this._today = true;
    },

    getPageEvent: function() {
        return this.widgetId() + "-pager";
    },

    onAttach: function(domNode) {
        var dataPane = domNode.find("div.data-pane")
        // ZM： 每个设备都有List显示数据吧?
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

        // 每个设备都能响应时间变化而改变数据内容呈现吧？
        $('body').bind('transfer-selected-time', function(event, startTime, endTime) {
            this_.dateRangeChanged && this_.dateRangeChanged(startTime, endTime);
        });

        var self = this;
        // ZM: 在设备派生类里面,如果_noAlertData不是true，那么在基类里面就能初始化报警的代码。
        // 注意_noAlertData是放到派生类里面。只有设备才知道哪些设备要报警，哪些不需要。
        // 但是统一都在基类一份代码干了。大不了不做。
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
        this.initChartIntervalChange(domNode.find('div.chart-interval'));

        domNode.find('select.chart-field').change(kx.bind(this, function(){
            this.onFieldChanged && this.onFieldChanged();
        }));

        this.initRefreshBar(domNode);
    },

    initRefreshBar: function(domNode) {
        var this_ = this;
        var bar = domNode.find('div.refresh-bar');

        bar.delegate('a', 'click', function(){
            this_.onShow();
            bar.fadeOut();
        });

        setInterval(kx.bind(this, function(){
            if (this._today)
            {
                this.hasLatestData(bar);
            }
        }), 100000);
        return false;
    },

    hasLatestData: function(bar) {
        // bar.css('display', '');

        var station = g.getCurrentStationId();
        var url = "data/latest/" + station + "/" + this._deviceType;

        this.ajax(url, null, function(data) {

            var r = eval("(" + data + ")");
            var latest = r['results']['status']
            console.log(111, latest);
            if (latest > this._lastestDataTime)
            {
                bar.css('display', '');
            }
        });

        return true;
    },


    onFieldChanged: function() {
        this.updateCharts && this.updateCharts();
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

    initChartIntervalChange: function(domNode) {
        if (!domNode.hasClass('chart-interval'))
            return false;
        var this_ = this;
        domNode.delegate('a', 'click', function(){
            var sender = $(this);

            sender.siblings().removeClass('red');
            sender.addClass('red');

            this_.onChartIntervalChanged && this_.onChartIntervalChanged($(this));
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
            var $r = eval("(" + data + ")");
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
                var $r = eval("(" + data + ")");

                var items = $r.results.items;
                this_._items = items;
                // Fetch today data and has data.
                console.log(items.length, this_._today);
                if (items.length > 0 && this_._today)
                {
                    this_._lastestDataTime = g.getUnixTime();
                }
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
            if (i == 'time' || i == 'starttime' || i == 'endtime' || i == 'sid' || i == 'lon' || i == 'lat') {
                continue;
            }
            var f = parseFloat(v[i]);
            if (!isNaN(f))
            {
                v[i] = f;
            }

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
            var m = key.substr(15, 1);
            var s = key.substr(17, 2);

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
            var m = key.substr(14, 2);
            var s = key.substr(17, 2);

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

    dateRangeChanged: function(range) {
        var payload = {
            start: range.start.toString('yyyy-MM-dd'),
            end: range.end.toString('yyyy-MM-dd') };

        this._today = false;
        if (range.start.toString('yyyy-MM-dd') == Date.today().toString('yyyy-MM-dd'))
        {
            this._today = true;
        }
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
        } else if (tabItem.hasClass('summary')) {
            this.onSummaryShow();
        }

        // Device
        this.onTabChanged && this.onTabChanged(tabItem);
    },

    chartFilterData: function(data, field, interval, step) {

        var datas = [];
        var times = [];
        var p = 0;

        var dict = [];

        step = step || 30 * 1000;

        var endTime = g.getEndTime().getTime();
        var beginTime = g.getBeginTime().getTime();

        var diff = endTime - beginTime;

        var count = 1;
        if (interval == 30 * 10000) {
            count = 10;
        } else if (interval == 3600 * 1000) {
            count = 120;
        }


        // Store data in a dict
        var item = null;
        for (var i in data) {
            item = data[i];
            var t = Date.parse(item['time']).getTime();
            dict[t] = item[field];
        }

        var counter = 0;
        var gv = new AverageValue();
        for (var i = beginTime; i <= endTime; i += step)
        {
            //
            if (counter == count) {
                counter = 0;

                datas.push( gv.getValue() );
                gv.clearValues();
            }

            counter += 1;
            gv.addValue(dict[i]);
        }

        return {'data': datas};
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




