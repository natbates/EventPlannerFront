import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";

const Location = () => {
    const { data: locationData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("location/fetch-location");
    const { user_id, name, role } = useAuth();
    const { updateEventPage } = useHistory();

    if (loading) return <p>Loading location...</p>;
    if (error) return <p>Error fetching location: {error.message}</p>;

    return (
        <div>
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    <img src="/svgs/back-arrow.svg" alt="Back" />
                </button>
                <h2>Location</h2>
            </div>

            {/* Displaying all location data */}
            <div className="location-details">
                <p><strong>Address:</strong> {locationData?.location?.address || "No address available"}</p>
                <p><strong>City:</strong> {locationData?.location?.city || "No city available"}</p>
                <p><strong>Postcode:</strong> {locationData?.location?.postcode || "No postcode available"}</p>
                <p><strong>Country:</strong> {locationData?.location?.country || "No country available"}</p>
            </div>
        </div>
    );
};


export default Location;
