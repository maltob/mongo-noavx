/**
 * list_indexes.js
 *
 * Checks that the listIndexes command can tolerate concurrent modifications to the
 * index catalog.
 */
import {assertAlways, assertWhenOwnColl} from "jstests/concurrency/fsm_libs/assert.js";

export const $config = (function() {
    var states = (function() {
        // Picks a random index to drop and recreate.
        function modifyIndices(db, collName) {
            var spec = {};
            spec['foo' + this.tid] = 1;

            assertWhenOwnColl.commandWorked(db[collName].dropIndex(spec));
            sleep(100);
            assertWhenOwnColl.commandWorked(db[collName].createIndex(spec));
        }

        // List indexes, using a batchSize of 2 to ensure getmores happen.
        function listIndices(db, collName) {
            var cursor = new DBCommandCursor(
                db, db.runCommand({listIndexes: collName, cursor: {batchSize: 2}}));
            assertWhenOwnColl.gte(cursor.itcount(), 0);
        }

        return {modifyIndices: modifyIndices, listIndices: listIndices};
    })();

    var transitions = {
        modifyIndices: {listIndices: 0.75, modifyIndices: 0.25},
        listIndices: {listIndices: 0.25, modifyIndices: 0.75}
    };

    function setup(db, collName) {
        // Create indices {fooi: 1}.
        for (var i = 0; i < this.threadCount; ++i) {
            var spec = {};
            spec['foo' + i] = 1;
            assertAlways.commandWorked(db[collName].createIndex(spec));
        }
    }

    return {
        threadCount: 10,
        iterations: 20,
        states: states,
        startState: 'modifyIndices',
        transitions: transitions,
        setup: setup
    };
})();
