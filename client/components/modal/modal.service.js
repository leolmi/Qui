'use strict';

angular.module('quiApp')
  .factory('Modal', ['$rootScope','$modal','cache',function ($rootScope,$modal,cache) {
    var modal_DELETE = 'delete';
    var modal_YESNOCANCEL = 'yesnocancel';
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
              opt.title = 'Confirma Eliminazione';
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
        }//,


        ///**
        // * Modifica una scadenza ...
        // * @param  {Function} exc - callback, ran when execution is confirmed
        // * @param  {Function} [dsc] - callback, ran when execution is discard
        // * @returns {Function}
        // */
        //edit: function(exc, dsc) {
        //  exc = exc || angular.noop;
        //  dsc = dsc || angular.noop;
        //
        //  return function() {
        //    var args = Array.prototype.slice.call(arguments);
        //
        //    var editModal = openModal({
        //      modal: {
        //        item: args[0],
        //        dismissable: true,
        //        idle: false,
        //        title: args[0].name,
        //        template: 'components/modal/modal-edit.html',
        //        buttons: [{
        //          classes: 'btn-primary onleft',
        //          text: 'Inserisci Valuta',
        //          click: function(e) {
        //            args.push({ action: 'handle'});
        //            editModal.dismiss(e);
        //          }
        //        },{
        //          classes: 'btn-success',
        //          text: 'Ok',
        //          click: function(e) {
        //            editModal.close(e);
        //          }
        //        },{
        //          classes: 'btn-warning',
        //          text: 'Annulla',
        //          click: function(e) {
        //            editModal.dismiss(e);
        //          }
        //        }]
        //      }
        //    }, 'modal-edit');
        //
        //    editModal.result.then(function(event) {
        //      exc.apply(event, args);
        //      resetModalState();
        //    }, function() {
        //      dsc.apply(event, args);
        //      resetModalState();
        //    });
        //  };
        //},

        ///**
        // * Aggiunge il pagamento
        // * @param add
        // */
        //handle: function(cb) {
        //  cb = cb || angular.noop;
        //
        //  /**
        //   * Apre il form modale
        //   * @param thing
        //   */
        //  return function() {
        //    var args = Array.prototype.slice.call(arguments),
        //      handleModal;
        //
        //    handleModal = openModal({
        //      modal: {
        //        dismissable: true,
        //        title: args[0].name,
        //        state: args[1],
        //        template: 'components/modal/modal-handle.html',
        //        buttons: [{
        //          classes: 'btn-success',
        //          text: 'OK',
        //          click: function(e) { handleModal.close(e); }
        //        }, {
        //          classes: 'btn-warning',
        //          text: 'Annulla',
        //          click: function(e) { handleModal.dismiss(e); }
        //        }],
        //        openDate: function(event) {
        //          event.preventDefault();
        //          event.stopPropagation();
        //          this.opened = true;
        //        }
        //      }
        //    }, 'modal-edit');
        //
        //    handleModal.result.then(function(event) {
        //      cb.apply(event, args);
        //      resetModalState();
        //    }, function() {
        //      resetModalState();
        //    });
        //  };
        //}
      }
    };
  }]);
