/**
* Created by Healer on 14-8-23.
*/

$class("WeatherDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "weather";
    },

    onAttach: function(domNode) {
        this.__super(DeviceBase.prototype.onAttach, [domNode]);

        this._dataListView.setHeaders([
            {'key':'time', 'name':'时间'},
            {'key':'Rainspeed', 'name':'雨量(mm)'},
            {'key':'Windspeed', 'name':'风速(m/s)'},
            {'key':'Direction', 'name':'风向(°)'},
            {'key':'Pressure', 'name':'气压(kPa)'},
            {'key':'Temperature', 'name':'温度(℃)'},
            {'key':'Humidity', 'name':'湿度(%)'}]);

        /*
        domNode.find('select.chart-field').change(kx.bind(this, function(){
            this.onFieldChanged();
        }));
        */
    },

    showChartsTab: function() {
        this._chartInterval = 30 * 10000;
        this.updateCharts();
    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var fieldItem = this._domNode.find('select.chart-field');
        var sel = fieldItem.find(":selected");
        var title = sel.text();
        var field = fieldItem.val();
        var min = sel.attr('min');
        var max = sel.attr('max');

        var interval =  this._chartInterval || 30 * 10000;

        this.showCharts(this._domNode,
        {
            selector: "div.charts",
            title: title,
            ytitle: title,
            start: start,
            end: end,
            max:max,
            min:min,
            interval: interval,
            filter: kx.bind(this, 'filter1')
        });

        /*
        this.showCharts(this._domNode, {
            selector: "div.charts2",
            title: "气压", ytitle: "气压",
            filter: kx.bind(this, 'filter2')
        });
        */
    },

    filter1: function(data) {
        var currentField = this._domNode.find('select.chart-field').val();
        return this.chartFilterData(data, currentField, this._chartInterval);

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

    },
});
