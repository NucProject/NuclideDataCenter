
$class("AddSecretTabPane", [kx.Widget, kx.ActionMixin, kx.EventMixin],
{
    _templateFile: "addsecrettab.html",

    _schoolId: null,

    _academyId: null,

    _grade: null,

    __constructor: function() {

    },


    onAttach: function(domNode) {

        kx.activeWeb(domNode, null);

        domNode.find("a.publish").click(kx.bind(this, "onPublish"));
        domNode.find("a.photo").click(kx.bind(this, "onAddPhoto"));

    },

    onPublish: function() {
        var w = Widget.widgetById("add-secrets-school-selector");
        var payload = {
            "user_id": 16653,
            "content": this.getContent(),
            "school_id": w.getSchoolId(),
            "academy_id": w.getAcademyId(),
            "grade": w.getGrade(),
            "background_index": 3

        };
        console.log(payload)
        this.ajax("admin/postSecret", payload, function(data){
            console.log(data);
        });
    },

    getContent: function() {
        return this._domNode.find("div.content").text();
    },

    onAddPhoto: function() {
        console.log("P");
    },


});