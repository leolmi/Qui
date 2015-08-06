'use strict';

angular.module('quiApp')
  .factory('Modal', ['$rootScope','$modal','cache',function ($rootScope,$modal,cache) {
    var modal_DELETE = 'delete';
    var modal_YESNOCANCEL = 'yesnocancel';
    var template_WELCOME = 'welcome';
    var template_INVITE = 'invite';
    var template_MEMBERINFO = 'memberinfo';
    /**
     * Opens a modal
     * @param  {Object} scope      - an object to be merged with modal's scope
     * @param  {String} modalClass - (optional) class(es) to be applied to the modal
     * @return {Object}            - the instance $modal.open() returns
     */
    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';

      angular.extend(modalScope, scope);

      cache.data.ismodal = true;

      return $modal.open({
        templateUrl: 'components/modal/modal.html',
        windowClass: modalClass,
        scope: modalScope
      });
    }

    function resetModalState() {
      cache.data.ismodal = false;
    }


    return {
      MODAL_DELETE:modal_DELETE,
      MODAL_YESNOCANCEL:modal_YESNOCANCEL,
      TEMPLATE_WELCOME:template_WELCOME,
      TEMPLATE_INVITE:template_INVITE,
      TEMPLATE_MEMBERINFO:template_MEMBERINFO,

      /* Confirmation modals */
      confirm: {
        /**
         * Returns options for right ask modal form
         * @param type
         */
        getAskOptions: function(type) {
          var args = Array.prototype.slice.call(arguments),
            type = args.shift();
          var opt = {
            title: '',
            body: '',
            ok: 'OK',
            okClass: 'btn-warning',
            okResult: 'ok',
            cancel: 'Annulla',
            cancelClass: 'btn-default',
            no: '',
            noClass: 'btn-danger',
            noResult: 'no',
            modalClass: 'modal-warning'
          };
          switch(type) {
            case(modal_DELETE):
              opt.title = 'Conferma Eliminazione';
              opt.body = '<p>Sicuro di voler eliminare <strong>' + args[0] + '</strong> ?</p>';
              opt.ok = 'Elimina';
              opt.okClass = 'btn-danger';
              opt.modalClass = 'modal-danger';
              break;
            case(modal_YESNOCANCEL):
              opt.ok = 'Si';
              opt.no = 'No';
              break;
          }
          return opt;
        },


        /**
         * Create a function to open a generic confirmation modal (ex. ng-click='myModalFn(options, arg1, arg2...)')
         * @param  {Function} exc - callback, ran when execution is confirmed
         * @param  {Function} [dsc] - callback, ran when execution is discard
         * @return {Function}     - the function to open the modal (ex. myModalFn)
         */
        ask: function(exc, dsc) {
          exc = exc || angular.noop;
          dsc = dsc || angular.noop;

          /**
           * Open a execution confirmation modal
           * @param  options   - class of modal options
           * @param  {All}     - any additional args are passed staight to del callback
           */
          return function() {
            var args = Array.prototype.slice.call(arguments),
              options = args.shift(),
              execModal;

            var buttons = [];
            if (options.ok) buttons.push({
                classes: options.okClass,
                text: options.ok,
                click: function(e) {
                  args.push(options.okResult);
                  execModal.close(e);
                }
              });
            if (options.no) buttons.push({
                classes: options.noClass,
                text: options.no,
                click: function(e) {
                  args.push(options.noResult);
                  execModal.close(e);
                }
              });
            if (options.cancel) buttons.push({
                classes: options.cancelClass,
                text: options.cancel,
                click: function(e) {
                  execModal.dismiss(e);
                }
              });

            execModal = openModal({
              modal: {
                dismissable: true,
                title: options.title,
                html: options.body,
                buttons: buttons
              }
            }, options.modalClass);

            execModal.result.then(function(event) {
              exc.apply(event, args);
              resetModalState();
            }, function(event){
              dsc.apply(event, args);
              resetModalState();
            });
          };
        },


        /**
         * Popup
         * @param  {Function} exc - callback, ran when execution is confirmed
         * @param  {Function} [dsc] - callback, ran when execution is discard
         * @returns {Function}
         */
        popup: function(exc, dsc) {
          exc = exc || angular.noop;
          dsc = dsc || angular.noop;


          /**
           * l'argomento principale è strutturato così:
           * args[0] => opt:
           *    opt.ok = { text:'OK' }
           *    opt.cancel = { text:'Annulla' }
           *    opt.title
           *    opt.template
           */
          return function() {
            var args = Array.prototype.slice.call(arguments),
              popupModal;

            var buttons = [];
            if (args[0].ok){
              buttons.push({
                classes: 'btn-success',
                text: args[0].ok.text || 'Ok',
                click: function(e) {
                  popupModal.close(e);
                }
              });
            }
            if (args[0].cancel) {
              buttons.push({
                classes: 'btn-warning',
                text: args[0].cancel.text || 'Annulla',
                click: function(e) {
                  popupModal.dismiss(e);
                }
              });
            }

            popupModal = openModal({
              modal: {
                context: args[0],
                dismissable: true,
                idle: false,
                title: args[0].title,
                template: 'components/modal/'+args[0].template+'.html',
                buttons: buttons
              }
            }, 'modal-popup');

            popupModal.result.then(function(event) {
              exc.apply(event, args);
              resetModalState();
            }, function() {
              dsc.apply(event, args);
              resetModalState();
            });
          };
        }
      }
    };
  }]);
