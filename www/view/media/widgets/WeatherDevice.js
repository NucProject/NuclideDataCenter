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
        return this.chartFilterData(data, 'Temperature');

    },

    filter2: function(data) {
        return this.chartFilterData(data, 'Pressure');
    }
});
