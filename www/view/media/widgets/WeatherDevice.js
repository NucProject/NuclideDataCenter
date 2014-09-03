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
            {'key':'Raingauge', 'name':'雨量'},
            {'key':'Windspeed', 'name':'风速'},
            {'key':'Direction', 'name':'风向'},
            {'key':'Pressure', 'name':'气压'},
            {'key':'Temperature', 'name':'温度'},
            {'key':'Humidity', 'name':'湿度'}]);
    },

    showChartsTab: function() {
        this.updateCharts();


    },

    updateCharts: function() {
        var start = g.getBeginTime().getTime();
        var end = g.getEndTime().getTime();

        var fieldItem = this._domNode.find('select.chart-field');
        var title = fieldItem.text();
        var field = fieldItem.val();

        var interval = 1000 * 30;

        this.showCharts(this._domNode,
        {
            selector: "div.charts",
            title: title,
            ytitle: title,
            start: start,
            end: end,
            max:150, min:40,
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
        return this.chartFilterData(data, currentField);

    }

    /*
    filter2: function(data) {
        return this.chartFilterData(data, 'Pressure');
    }
    */
});
