/**
* Created by Healer on 14-8-23.
*/

$class("WeatherDevice", DeviceBase,
{
    __constructor: function() {
        this._deviceType = "weather";
        this._noAlertData = true;
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

        this.updateCharts();
    },

    fixData: function(value) {
        value.Direction = this.getDirStr(value.Direction);
        return value;
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
        }else if (sender.hasClass('d1')) {
            this._chartInterval = 24*3600 * 1000;
        }
        else {
            // 5min as default;
            this._chartInterval = 30 * 10000;
        }

        this.updateCharts();

    },

    getDirStr: function(d) {
        var direction = parseInt(d);
        var strDirection = d + "°";
            if (348 < direction && direction <= 360)
            {
                strDirection += " (N)";
            }
            else if (direction <= 11)
            {
                strDirection += " (N)";
            }
            else if (11 < direction && direction <= 33)
            {
                strDirection += " (NNE)";
            }
            else if (33 < direction && direction <= 56)
            {
                strDirection += " (NE)";
            }
            else if (56 < direction && direction <= 78)
            {
                strDirection += " (ENE)";
            }
            else if (78 < direction && direction <= 101)
            {
                strDirection += " (E)";
            }
            else if (101 < direction && direction <= 123)
            {
                strDirection += " (ESE)";
            }
            else if (123 < direction && direction <= 146)
            {
                strDirection += " (SE)";
            }
            else if (146 < direction && direction <= 168)
            {
                strDirection += " (SSE)";
            }
            else if (168 < direction && direction <= 191)
            {
                strDirection += " (S)";
            }
            else if (191 < direction && direction <= 213)
            {
                strDirection += " (SSW)";
            }
            else if (213 < direction && direction <= 236)
            {
                strDirection += " (SW)";
            }
            else if (236 < direction && direction <= 258)
            {
                strDirection += " (WSW)";
            }
            else if (258 < direction && direction <= 281)
            {
                strDirection += " (W)";
            }
            else if (281 < direction && direction <= 303)
            {
                strDirection += " (WNW)";
            }
            else if (303 < direction && direction <= 326)
            {
                strDirection += " (NW)";
            }
            else if (326 < direction && direction <= 348)
            {
                strDirection += " (NNW)";
            }
        return strDirection;
    }
});
