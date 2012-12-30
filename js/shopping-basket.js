/**
 * User: rnugraha
 * Date: 12/27/12
 * Time: 3:30 PM
 */

$(document).ready(function() {

	/* GUI initialization
	 ----------------------------------*/
	$( ".button" ).button();

	/* Product Category
	 ----------------------------------*/
	var Category = Backbone.Model.extend({

	});

	var CategoryCollection = Backbone.Collection.extend({
		model: Category,
		comparator: function (category)
		{
			return category.get("category_id");
		}
	});

	var CategoryView = Backbone.View.extend({
		el: $('#categories'),
		template: $('#prod-cat-tmpl').template(),
		render: function(){

			$( "#categories" ).selectable({
				selected: function (event, ui) {
					$("#productList").empty();

					var items = new ItemCollection;

					// get JSON data based on selected category
					items.url =  "data/" + $(".ui-selected").attr('label') + "_data.json";
					items.fetch({async: false}); // fetch synchronously

					// render products based on selected category
					var itemViewList = new ItemViewList({collection: items});
					itemViewList.render();

				}
			});

			$.tmpl(this.template, this.model.toArray()).appendTo(this.el);
			return this;
		}

	});

	/* Product Item
	 ----------------------------------*/
	var Item = Backbone.Model.extend({
	});

	var ItemCollection = Backbone.Collection.extend({
		model: Item,

		parse: function(response) {
			return response;
		},

		comparator: function (product)
		{
			return product.get("category_id");
		}
	});

	var ItemViewList = Backbone.View.extend({
		el: $('#productList'),
		initialize: function(){
			_.bindAll(this, "renderItem");
		},
		renderItem: function(model){
			var itemView = new ItemView({model: model});
			itemView.render();
			$(this.el).append(itemView.el);
		},
		render: function() {
			this.collection.each(this.renderItem);
		}
	});

	var ItemView = Backbone.View.extend({
		className: 'ui-widget-content draggable',
		template: $('#prod-item-tmpl').template(),
		initialize: function () {
			$(this.el).draggable({
				helper: 'clone',
				opacity: 0.65
			});
			$(this.el).data("backbone-view", this);
		},
		render: function() {
			var html = $.tmpl(this.template, this.model);
			$(this.el).append(html);
			return this;
		}
	});

	/* Order
	 ----------------------------------*/
	var Order = Backbone.Model.extend({
		defaults: {
			totalPrice: 0,
			orderedProducts: null
		}
	});

	var OrderedProducts = Backbone.Collection.extend({
		model: Item
	});

	var coll = new OrderedProducts;

	var OrderedProductView = Backbone.View.extend({
		el: $('#basketPanel'),
		template: $('#order-item-tmpl').template(),
		render: function() {
			// render as jquery ui droppable
			$( ".basketPanel" ).droppable({
				tolerance: 'pointer',
				create: function (event, ui) {
					var emptyBasketTmpl = $('#empty-order-tmpl').template();
					$.tmpl(emptyBasketTmpl).appendTo(this);
				},

				over: function( event, ui ) {
					$( this )
						.addClass( "ui-state-highlight" )
				},

				drop: function( event, ui ) {
					$( this ).removeClass( "ui-state-highlight" );
					var model = $(ui.draggable).data("backbone-view").model;
					coll.add(model);
					console.log(coll.toJSON());
				}
			});
		}
	});

	/* Application Router
	----------------------------------*/
	var AppRouter = Backbone.Router.extend({
		_cat_data: null,
		_cat_items: null,
		_cat_view: null,

		_basket_view: null,

		initialize: function (options)
		{
			var _this = this;
			$.ajax({
				url: "data/ProductCategories_data.json",
				dataType: 'json',
				data: {},
				async: false,
				success: function (data)
				{
					_this._cat_data = data;
					_this._cat_items = new CategoryCollection(data);
					_this._cat_view = new CategoryView({ model: _this._cat_items });
					_this._cat_view.render();

					_this._basket_view = new OrderedProductView;
					_this._basket_view.render();

					Backbone.history.loadUrl();
				}
			});

			return this;
		}
	});

	var appRouter = new AppRouter;

	Backbone.history.start();
});