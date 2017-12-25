/**
 * Job status model, which is a placeholder for all input parameters required to update the job audit tables.
 * 
 * @author Pravat
 */
class JobStatusModel {

    /**
     * @param {number} src_id 
     * @param {String} src_vendor_name 
     * @param {number} target_id 
     * @param {String} target_vendor_name 
     * @param {String} execution_arn
     * @param {String} execution_name
     * @param {String} event_name
     */
    constructor(src_id, src_vendor_name, target_id, target_vendor_name, execution_name, execution_arn, event_name) {
        this.src_id = src_id;
        this.src_vendor_name = src_vendor_name;
        this.target_id = target_id;
        this.target_vendor_name = target_vendor_name;
        this.execution_arn = execution_arn;
        this.execution_name = execution_name;
        this.event_name = event_name;
    }

    getExectionArn() {
        return this.execution_arn;
    }

    getExecutionName() {
        return this.execution_name;
    }

    setEventName(event_name){
        this.event_name = event_name;
    }

    getEventName() {
        return this.event_name;
    }

    setSourceId(src_id) {
        this.src_id = src_id;
    }

    getSourceId() {
        return this.src_id;
    }

    setSourceVendor(source_vendor) {
        this.src_vendor_name = source_vendor;
    }
    getSourceVendor() {
        return this.src_vendor_name;
    }

    getTargetId() {
        return this.target_id;
    }
    getTargetVendor() {
        return this.target_vendor_name;
    }
}

module.exports = JobStatusModel;