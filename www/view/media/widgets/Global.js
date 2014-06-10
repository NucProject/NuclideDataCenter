/**
 * Created by Healer on 14-6-10.
 */


$class("Global", Base,
{
    _row: null,

    _curStationId: null,


    init: function() {

        var self = this;
        $("ul.sub-menu a").click(function(){

            var url = $(this).attr("href");
            var id = url;

            self.showRow(id);

            return false;
        });
    },

    addRow: function(row) {
        if (!this._row) {
            this._row = [];
        }

        this._row.push(row);
    },

    showRow: function(row) {
        for (var i in this._row)
        {
            if (this._row[i] == row)
            {
                $(row).show();
            }
            else
            {
                $(this._row[i]).hide();
            }
        }
    },

    getDeviceName: function(deviceType) {
        switch (deviceType)
        {
            case "hpic":
                return "高压电离室";
            case "labr":
                return "Labr";
            case "cinderella":
                return "cinderella";
            case "hpge":
                return "高纯锗谱仪";
            case "weather":
                return "气象";
            case "environment":
                return "环境与安防";
        }
    },

    getCurrentStationId: function() {
        return this._curStationId;
    },

    setCurrentStationId: function(stationId) {
        this._curStationId = stationId;
    }
});
