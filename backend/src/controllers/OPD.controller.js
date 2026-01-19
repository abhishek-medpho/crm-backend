import apiResponse from "../utils/apiResponse.utils.js";
import asyncHandler from "../utils/asynchandler.utils.js";
import { pool } from "../DB/db.js";
export default class opdController {

    /**
     * @description Get a all OPD bookings
     * @route GET /api/v1/OPD/getOPDBookings
     */
    getOPDBookings = asyncHandler(async (req, res) => {
        const loggedInUser = req.user;
        const id = loggedInUser.id;
        const result = await pool.query(
            `WITH HospitalList AS ( SELECT b.id AS booking_id, STRING_AGG(h.hospital_name, ', ')
             AS hospital_names FROM crm.opd_bookings b LEFT JOIN crm.hospitals h ON h.id = ANY(b.hospital_ids)
             GROUP BY b.id ) SELECT b.booking_reference,CONCAT(us.first_name, ' ', us.last_name) AS 
             Agent_Name,b.patient_name, b.patient_phone, b.age, b.gender, b.medical_condition, hl.hospital_names, 
             CONCAT(d.first_name, ' ', d.last_name) AS Doctor_Name, b.appointment_date, b.current_disposition, 
             b.aadhar_card_url,b.pmjay_card_url, b.payment_mode, b.source, b.created_at,b.updated_at 
             FROM crm.opd_bookings b JOIN HospitalList hl ON b.id = hl.booking_id JOIN crm.users us 
             ON b.created_by_agent_id = us.ID left outer JOIN crm.doctors d on b.referee_id = d.ID 
             WHERE us.id = $1
             Order BY b.created_at DESC`,[id]
        );
        res.status(200).json(new apiResponse(200, result.rows, "Bookings fetched successfully"));
    });

    /**
     * @description Get Doctor Portfolio
     * @route GET /api/v1/OPD/getDoctorPortfolio
     */
    getDoctorPortfolio = asyncHandler(async (req, res) => {
        const loggedInUser = req.user;
        const id = loggedInUser.id;
        const result = await pool.query(
            `WITH meetings AS (
                SELECT 
                    doctor_id,
                    COUNT(*) AS total_meetings,
                    MIN(created_at) AS first_meeting,
                    MAX(created_at) AS last_meeting
                FROM crm.doctor_meetings
                GROUP BY doctor_id
            ),

            bookings AS (
                SELECT
                    referee_id AS doctor_id,
                    COUNT(*) AS total_leads,
                    SUM(CASE 
                        WHEN current_disposition = 'Admitted' THEN 1 
                        ELSE 0 
                    END) AS total_ipd
                FROM crm.opd_bookings
                GROUP BY referee_id
            )

            SELECT
                CONCAT(u.first_name, ' ', u.last_name) AS Agent_Name,
                CONCAT(d.first_name, ' ', d.last_name) AS Doctor_Name,
                d.gps_location_link,

                m.first_meeting AS First_meeting,
                m.last_meeting AS Last_meeting,

                COALESCE(m.total_meetings, 0) AS Number_of_Meetings,
                COALESCE(b.total_leads, 0) AS Number_of_Leads,
                COALESCE(b.total_ipd, 0) AS Number_of_IPD,

                d.assigned_agent_id_secondary

            FROM crm.doctors d
            JOIN crm.users u 
                ON d.assigned_agent_id_primary = u.id

            LEFT JOIN meetings m 
                ON d.id = m.doctor_id

            LEFT JOIN bookings b 
                ON d.id = b.doctor_id

            WHERE u.id = $1;`,[id]
        );
        res.status(200).json(new apiResponse(200, result.rows, "Doctor Portfolio fetched successfully"));
    });

    /**
     * @description Get meetings logged by the agent
     * @route GET /api/v1/OPD/getMeetings
     */
    getMeetings = asyncHandler(async (req, res) => {
        const loggedInUser = req.user;
        const id = loggedInUser.id;
        const result = await pool.query(
            `SELECT CONCAT(u.first_name, ' ', u.last_name) AS Agent_Name, CONCAT(d.first_name, ' ',
             d.last_name) AS Doctor_Name, dm.created_at as Meeting_date, dm.Gps_Location_Link, dm.photos->>'clinicImage'
             AS clinic_image, dm.photos->>'selfieImage' AS selfie_image, dm.duration, dm.meeting_notes, 
             dm.meeting_summary from crm.doctor_meetings dm left join crm.users u on dm.agent_id = u.id 
             join crm.doctors d on dm.doctor_id = d.id WHERE u.id = $1;`,[id]
        );
        res.status(200).json(new apiResponse(200, result.rows, "Meetings fetched successfully"));
    });

    /**
     * @description Get meetings logged by the agent
     * @route GET /api/v1/OPD/getMatrix
     */
    getMatrix = asyncHandler(async (req, res) => {
        const loggedInUser = req.user;
        const id = loggedInUser.id;
        const totalMeetingsThisMonth = await pool.query(
            `SELECT COUNT(dm.id) AS meetings_count
             FROM crm.doctor_meetings dm
             JOIN crm.users u ON dm.agent_id = u.id
             WHERE u.id = $1
             AND dm.created_at >= DATE_TRUNC('month', CURRENT_DATE)
             AND dm.created_at <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';`,
             [id]
        );

        const leadsThisMonth = await pool.query(
            `SELECT COUNT(b.id) AS leads_count
             FROM crm.opd_bookings b
             JOIN crm.users u ON b.created_by_agent_id = u.id
             WHERE u.id = $1
             AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE)
             AND b.created_at <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';`,[id]
        );

        const ipdThisMonth = await pool.query(
            `SELECT COUNT(b.id) AS ipd_count
             FROM crm.opd_bookings b
             JOIN crm.users u ON b.created_by_agent_id = u.id
             WHERE u.id = $1
             AND b.current_disposition = 'Admitted'
             AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE)
             AND b.created_at <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';`,[id]
        );

        const matrix = {
            meetings_this_month: totalMeetingsThisMonth.rows[0].meetings_count,
            leads_this_month: leadsThisMonth.rows[0].leads_count,
            ipd_this_month: ipdThisMonth.rows[0].ipd_count
        };

        res.status(200).json(new apiResponse(200, matrix, "Matrix data fetched successfully"));
    });

}