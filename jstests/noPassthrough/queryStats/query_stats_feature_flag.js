/**
 * Test that calls to read from query stats store fail when feature flag is turned off.
 */
import {FeatureFlagUtil} from "jstests/libs/feature_flag_util.js";

// This test specifically tests error handling when the feature flag is not on.
// TODO SERVER-65800 this test can be removed when the feature flag is removed.
// TODO SERVER-79494 remove reference to featureFlagQueryStatsFindCommand.
// Disable via TestData so there's no conflict in case a variant has all flags enabled.
TestData.setParameters.featureFlagQueryStatsFindCommand = false;
TestData.setParameters.featureFlagQueryStats = false;
const conn = MongoRunner.runMongod();
assert.neq(null, conn, 'failed to start mongod');
const testDB = conn.getDB('test');

// Pipeline to read telemetry store should fail without feature flag turned on.
assert.commandFailedWithCode(
    testDB.adminCommand({aggregate: 1, pipeline: [{$queryStats: {}}], cursor: {}}),
    ErrorCodes.QueryFeatureNotAllowed);

// Pipeline, with a filter, to read telemetry store fails without feature flag turned on.
assert.commandFailedWithCode(testDB.adminCommand({
    aggregate: 1,
    pipeline: [{$queryStats: {}}, {$match: {"key.queryShape.find": {$eq: "###"}}}],
    cursor: {}
}),
                             ErrorCodes.QueryFeatureNotAllowed);

MongoRunner.stopMongod(conn);
