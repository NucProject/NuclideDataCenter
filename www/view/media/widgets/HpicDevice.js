/**
 * Created by Healer on 14-8-23.
 */
$class("HpicDevice", [DeviceBase, SettingPane],
{
    __constructor: function() {
        this._deviceType = "hpic";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this.setDevice(this._deviceType);
        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'doserate', 'name':'剂量率(nGy/h)', type: 'num'},
            /*
            {'key':'battery', 'name':'电池电压(V)', type: 'num'},
            */
            {'key':'highvoltage', 'name':'探头电压(V)', type: 'num'},
            {'key':'temperature', 'name':'探头温度(℃)', type: 'num'}]);

    },

    showChartsTab: function() {
        this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var interval =  this._chartInterval || 30 * 10000;
        console.log("!",interval);
        this.showCharts(this._domNode,
            {
                selector: "div.charts",
                title: "剂量率",
                ytitle: "nGy/h",
                start: start,
                end: end,
                max:150, min:40,
                interval: interval,
                filter: kx.bind(this, 'filter')
            }
        );
    },

    filter: function(data) {
        var currentField = 'doserate';
        return this.chartFilterData(data, currentField, this._chartInterval, this._step);
    },

    onTabChanged: function(tabItem) {
        if (tabItem.hasClass('alerts'))
        {
            var w = this._domNode.find('.alert-select');
                w.val(2);
                w.trigger('change');
        }
    },

    onChartIntervalChanged: function(sender) {
        if (sender.hasClass('m5')) {
            this._chartInterval = 30 * 10000;
        } else if (sender.hasClass('s30')) {
            this._chartInterval = 30 * 1000;
        } else if (sender.hasClass('h1')) {
            this._chartInterval = 3600 * 1000;
        } else if (sender.hasClass('d1')) {
            this._chartInterval = 24*3600 * 1000;
        }
        else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    }

});

