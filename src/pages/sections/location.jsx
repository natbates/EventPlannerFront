import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";

const Location = () =>
{
    const { data: locationData, error, loading, event_id, refetch, goEventPage } = useFetchEventData("location/fetch-location");
    const { user_id, name, role } = useAuth();
    const {updateEventPage} = useHistory();

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
            <p>{locationData?.location || "No location available"}</p>
        </div>
    );
};

export default Location;
