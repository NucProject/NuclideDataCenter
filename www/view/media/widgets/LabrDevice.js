/**
* Created by Healer on 14-8-23.
*/


$class("LabrDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "labr";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'总剂量率（nSv/h）', type: 'num', accuracy: 4},
            {'key':'temperature', 'name':'探头温度（℃）', type: 'num'},
            {'key':'highvoltage', 'name':'探头高压（V）', type: 'num'},
            {'key':'starttime', 'name':'开始时间'},
            {'key':'endtime', 'name':'结束时间'},
            {'key':'refnuclidefound', 'name':"找到参考核素", 'type': 'bool'},
            {'key':'N42path', 'name':'链接', 'type': 'url'}]
        );
    },

    showChartsTab: function() {
        this._chartInterval = 30 * 10000;
        this._step = 30 * 10000;
        this.updateCharts();
    },

    filter: function(data) {
        this._chartInterval = 30 * 10000;
        this._step = 30 * 10000;
        var result =  this.chartFilterData(data, 'doserate', this._chartInterval, this._step);

        return result;
    },

    fillListDefault: function(page) {
        this.fillList(page)
    },

    /*
    fixValue: function(v) {
        v['doserate'] = 1000 * v['doserate'];
        return this.__super(DeviceBase.prototype.fixValue, [v]);
    },*/

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        console.log(start, end)

        var max = 10;
        var min = -10;
        var interval =  this._chartInterval || 30 * 10000;
        var this_ = this;
        this.showCharts(this._domNode, {
            selector: "div.charts",
            title: "剂量率",
            ytitle: "剂量率",
            start: start,
            end: end,
            max:max,
            min:min,
            interval: interval,
            filter: kx.bind(this_, 'filter')
        });


    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            // this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    }
});

