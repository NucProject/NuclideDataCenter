/**
 * Created by Healer on 14-6-5.
 */

$class("ListView", [kx.Weblet, kx.ActionMixin],
{
    _headers: null,

    _templateString: "<table class='table table-striped table-bordered table-hover table-full-width dataTable'><thead></thead>><tbody></tbody></table>",

    __constructor: function() {

    },

    onCreated: function(domNode) {

    },

    refresh: function(api) {
        this.ajax(api, null, kx.bind(this, "dataReceived"));
    },

    setHeaders: function(headers) {
        this._headers = headers;
    },

    dataReceived: function(data) {
        console.log("ListView.dataReceived");



        var tbody = this._domNode.find("tbody");

        var results = eval("(" + data + ")")['results'];
        var items = results['items'];


        for (var i in items)
        {
            var cl = ["<tr>"];
            var item = items[i];
            for (var j in item)
            {
                cl.push('<td>');
                cl.push(item[j]);
                cl.push('</td>');
            }

            cl.push("</tr>");

            var html = cl.join("");

            tbody.append($(html));
        }
    }
});