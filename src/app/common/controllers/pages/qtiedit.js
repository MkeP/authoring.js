(function() {
  'use strict';
  this.QtiEditController = Ember.ObjectController.extend({
    /**
     * To be handled somewhere else...
     */
    thumb: (function(key, value) {
      if (!this.get('content'))
        return;
      if (!this.get('content.thumbnail'))
        return;
      var reader = new FileReader();
      reader.onload = (function(event) {
        this.content.set('img', event.target.result);
      }.bind(this));
      reader.readAsDataURL(this.get('content.thumbnail'));//Convert the blob from clipboard to base64
    }).observes('content.thumbnail'),

    // isSimple: (function(key, value) {
    //   if(!this.get('content'))
    //     return;
    //   if(!this.get('content').get('flavor'))
    //     return;
    //   this.content.set('isSimple', this.get('flavor').title == I18n.translate('activities.pageFlavors').staticPage);
    //   this.content.set('isQuizz', this.get('flavor').title == I18n.translate('activities.pageFlavors').quizz);
    //   this.content.set('isTat', this.get('flavor').title == I18n.translate('activities.pageFlavors').tat);
    // }).observes('content.flavor'),


    /**
     * Pages management
     */

    isStaticPage: false,
    isQuizz: false,
    isQuizzQcm: false,
    isQuizzMulti: false,
    isTat: false,
    flavorLabel: '',


    _updateCurrentFlavor: function() {
      var value = this.get('currentPage.flavor');

      this.set('isStaticPage', false);
      this.set('isQuizz', false);
      this.set('isTat', false);
      this.set('isQuizzQcm', false);
      this.set('isQuizzMulti', false);

      if (value == 'staticPage') {
        this.set('isStaticPage', true);
      } else if (value == 'quizz') {
        this.set('isQuizz', true);
        this.set('isQuizzQcm', true);
      } else if (value == 'quizzMulti') {
        this.set('isQuizz', true);
        this.set('isQuizzMulti', true);
      } else if (value == 'tat') {
        this.set('isTat', true);
      }

      this.set('flavorLabel', I18n.translate('activities.pageFlavors')[value]);

    }.observes('currentPage.flavor'),


    addPage: function(at) {
      var newPage = new LxxlLib.Model.Page();
      if (!at)
        this.content.get('pages').pushObject(newPage);
      else
        this.content.get('pages').replace(at, 0, [newPage]);
      this.set('currentPage', newPage);
    },

    deletePage: function(page) {
      if (this.get('currentPage') == page)
        this.set('currentPage', null);
      var pages = this.content.get('pages');
      pages.replace(pages.indexOf(page), 1);
      // console.warn("--delete");
      // this.content.get('pages').forEach(function(item){console.warn(item, item.title);});
    },

    movePage: function(page, pos) {
      var pages = this.content.get('pages');
      pages.replace(pages.indexOf(page), 1);
      pages.replace(pos, 0, [page]);
      // this.content.get('pages').forEach(function(item){console.warn(item, item.title);});
    },


    doPreview: function(node, activity) {
      var a = new LxxlLib.activity();
      a.setupViewport(node, true);
      // a.addStyle('body{background-color: blue;}');
      /*
    a.addStyle('http://static.loft.sn.ackitup.net:4242/lib/frameworks/normalize/normalize-2.0.css');
    */
      a.setupTemplate('{PUKE-PACKAGE-VERSION}/activity/activity.tpl');

      a.showActivity(this.content, function() {
        console.warn('All set baby!');
      });
    },


    /**
     * Current page management
     */
    _storedCurrentPage: null,

    currentPage: (function(key, value) {
      // Getter
      //
      window.TEST = this;
      if (arguments.length === 1) {
        // Empty(ed) document gets null
        if (!this.get('content.pages.length'))
          return this.set('_storedCurrentPage', null) && null;
        return this.get('_storedCurrentPage');
      }

      // Setter
      this.set('_storedCurrentPage', value);
      return value;
    }).property('content', 'content.pages.length'),


    pageActivatedLimitedTime: (function(key, value) {
      if (arguments.length === 1) {
        return !!this.get('currentPage.limitedTime');
      }
      this.get('currentPage').set('limitedTime', value ? 60 : 0);

      return !!this.get('currentPage.limitedTime');

    }).property('currentPage', 'currentPage.limitedTime'),


    limitedTimeUpdated: function() {
      if (!this.get('currentPage'))
        return;

      if (!this.get('minutes.selected') || !this.get('seconds.selected'))
        return;

      var time = this.get('minutes.selected.id') * 60;
      time += this.get('seconds.selected.id');
      this.set('currentPage.limitedTime', time);
    }.observes('currentPage', 'minutes.selected', 'seconds.selected'),

    setSelectedLimitedTime: function() {
      var date = new Date(null);

      date.setSeconds(this.get('currentPage.limitedTime'));
      var time = date.toUTCString().split('1970 ').pop().split('GMT').shift().split(':').map(function(i) {
        return parseInt(i);
      });

      var selectedMinute = null;
      this.get('minutes.content').forEach(function(i) {
        if (i.id == time[1])
          selectedMinute = i;
      });

      var selectedSecond = null;

      this.get('seconds.content').forEach(function(i) {
        if (i.id == time[2])
          selectedSecond = i;
      });

      this.set('minutes.selected', selectedMinute);
      this.set('seconds.selected', selectedSecond);
    }.observes('currentPage.limitedTime'),

    pageActivatedSequencing: (function(key, value) {
      if (arguments.length === 1) {
        return !!(this.get('currentPage.sequencing') >= 0 ? true : false);
      }

      this.get('currentPage').set('sequencing', value ? 0 : -1);
      return !!(this.get('currentPage.sequencing') >= 0 ? true : false);

    }).property('currentPage.sequencing'),

    _storedCurrentQuestion: null,

    currentQuestion: (function(key, value) {
      // Getter
      if (arguments.length === 1) {
        // Empty(ed) document gets null
        if (!this.get('currentPage.questions').length)
          return this.set('_storedCurrentQuestion', null) && null;
        return !this.get('_storedCurrentQuestion') && this.get('currentPage.questions')[0] ||
            this.get('_storedCurrentQuestion');
      }

      // Setter
      this.set('_storedCurrentQuestion', value);
      return value;
    }).property('currentPage', 'currentPage.questions.length'),


    addQuestion: function(at) {
      var nq = new LxxlLib.Model.Question();
      if (!at)
        this.get('currentPage.questions').pushObject(nq);
      else
        this.get('currentPage.questions').replace(at, 0, nq);
      this.set('currentQuestion', nq);
    },

    deleteQuestion: function(question) {
      if (this.get('currentQuestion') == question)
        this.set('currentQuestion', null);
      this.get('currentPage.questions').replace(this.get('currentPage.questions').indexOf(question), 1);
    },

    moveQuestion: function(question, pos) {
      this.get('currentPage.questions').replace(this.get('currentPage.questions').indexOf(question), 1);
      this.get('currentPage.questions').replace(pos, 0, [question]);
    },



    addAnswer: function(at) {
      if (!at)
        this.get('currentQuestion.answers').pushObject(new LxxlLib.Model.Answer());
      else
        this.get('currentQuestion.answers').replace(at, 0, new LxxlLib.Model.Answer());
    },

    deleteAnswer: function(answer) {
      this.get('currentQuestion.answers').replace(this.get('currentQuestion.answers').indexOf(answer), 1);
    },

    moveAnswer: function(answer, pos) {
      this.get('currentQuestion.answers').replace(this.get('currentQuestion.answers').indexOf(answer), 1);
      this.get('currentQuestion.answers').replace(pos, 0, [answer]);
    },



    /**
     * Categories handling
     */
    // matters: (function() {
    //   return LxxlLib.factories.metadata.matters;
    // }).property('LxxlLib.factories.metadata.matters'),

    // levels: (function() {
    //   return LxxlLib.factories.metadata.levels;
    // }).property('LxxlLib.factories.metadata.levels'),

    matters: Ember.Object.create({
      content: LxxlLib.factories.metadata.matters
    }),

    levels: Ember.Object.create({
      content: LxxlLib.factories.metadata.levels
    }),

    testToto: function() {
      if (!this.get('content.level') || !this.get('content.matter'))
        return;
      var tree = LxxlLib.factories.metadata.getTreeFor(this.get('content.matter.id'), this.get('content.level.id'));
      this.set('categoryTree.content', (tree && tree.content) || []);
    }.observes('content', 'content.level', 'content.matter'),

    categoryTree: Ember.Object.create({
      content: []
    }),

    lengths: Ember.Object.create({
      content: LxxlLib.factories.metadata.lengths
    }),

    difficulties: Ember.Object.create({
      content: LxxlLib.factories.metadata.difficulties
    }),

    flavors: Ember.Object.create({
      content: [],
      init: function() {
        this._super();
        var values = I18n.translate('activities.pageFlavors');
        for (var key in values) {
          this.get('content').pushObject({
            'id' : key,
            'title' : values[key]
          });
        }
      }
    }),

    minutes: Em.Object.create({
      content: [],
      selected: null,

      init: function() {

        var values = [0, 1 , 2, 3, 4, 5, 10, 15, 20, 30, 45, 60, 90];
        for (var i = 0; i < values.length; i++) {
          this.get('content').pushObject({
            'id' : values[i],
            'title' : values[i] + (values[i] > 1 ? ' minutes' : ' minute')
          });
        }
        this.set('selected', this.get('content')[0]);

      }
    }),
    seconds: Em.Object.create({
      content: [],
      selected: null,

      init: function() {
        var values = [0, 10, 20, 30, 45];
        for (var i = 0; i < values.length; i++) {
          this.get('content').pushObject({
            'id' : values[i],
            'title' : values[i] + (values[i] > 1 ? ' secondes' : ' seconde')
          });
        }
        this.set('selected', this.get('content')[0]);

      }
    })

    /**
     * Various select handling
     */


    /*
    reset: function(){
    }
 */

    // cheat: "*********************/// *******************",

    // toto: function(){
    //   return this.get('content');
    // }.property('content'),

  });

}).apply(LxxlApp);


// var activityFactory = new (function(){
//   this.getActivityById = function(id){
//     return ;
//   };

//   this.newActivity = function() {
//     return new LxxlLib.Model.Activity();
//   };
// })();


