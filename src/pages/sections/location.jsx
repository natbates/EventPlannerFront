import useFetchEventData from "../../hooks/useFetchEventData";
import { useAuth } from "../../contexts/auth";
import { useHistory } from "../../contexts/history";
import "../../styles/location.css";
import PageError from "../../components/PageError";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import MapComponent from "../../components/Map";
import { useNotification } from "../../contexts/notification";
import { useTheme } from "../../contexts/theme";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../components/App";

const Location = () => {
    const { data: locationData, error, loading, event_id, refetch, goEventPage, setError, setLoading} = useFetchEventData("location/fetch-location");
    const { user_id, name, role } = useAuth();
    const { updateEventPage } = useHistory();
    const [location, setLocation] = useState(null); // State for storing fetched location
    const [manualLocation, setManualLocation] = useState({
        address: locationData?.location?.address || "",
        city:  locationData?.location?.city || "",
        postcode:  locationData?.location?.postcode || "",
        country:  locationData?.location?.country || ""
    });
    const [initialLocation, setInitialLocation] = useState({});
    const {notify, setNotifyLoad, notifyLoad} = useNotification();
    const {theme} = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        setManualLocation({
            address: locationData?.location?.address || "",
            city:  locationData?.location?.city || "",
            postcode:  locationData?.location?.postcode || "",
            country:  locationData?.location?.country || ""
        });}, 
    [locationData]);

    const cancelManualInput = () => {
        // Reset manualLocation to initial values
        setManualLocation(initialLocation);
        console.log("Manual location reset to initial values:", initialLocation);
    };

    const handleManualInputChange = (e) => {
        const { name, value } = e.target;
        setManualLocation((prev) => ({ ...prev, [name]: value }));
    };

    const submitManualLocation = async () => {
        try {
            // Try to get coordinates from geocodeAddress
            setNotifyLoad(true);
            const coords = await geocodeAddress({ location: manualLocation });
    
            if (!coords) {
                console.log("No coordinates found for the provided address.");
            }
            // Check if coords is available, otherwise set lat and lon to 0
            const newLocation = {
                ...manualLocation,
                lat: coords ? coords.lat : 0,  // If coords are available, use them; otherwise, set to 0
                lon: coords ? coords.lon : 0   // If coords are available, use them; otherwise, set to 0
            };
    
            // Update the map with the new coordinates
            if (coords) {
                setLocation({ lat: coords.lat, lon: coords.lon });
            }
    
            // Update the server with the new location
            await updateLocation(newLocation);
    
        } catch (err) {
            console.error("Failed to submit manual location:", err);
        }
    };

    const geocodeAddress = async (locationData) => {
        const { address, city, postcode, country } = locationData.location;
    
        const fullAddress = [address, city, postcode, country].filter(Boolean).join(", ");
    
        if (!fullAddress || fullAddress.trim().length < 5) {
            notify("Please provide a valid address before searching.");
            return null;
        }
        setNotifyLoad(true);
        
        const apiKey = "f9dc74471bf04fdda78a121a06481d0c"; // Replace with your OpenCage API key
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry;
                console.log("Geocoded Location:", { lat, lon: lng });
                setLocation({ lat, lon: lng });
                return { lat, lon: lng };
            } else {
                notify("Address not found.");
                return null;
            }
        } catch (err) {
            notify("Error fetching geolocation. Please try again.");
            return null;
        } finally
        {
            setNotifyLoad(false);   
        }        
    };
    

    const setNewLocation = async (coords) => {
        console.log("Clicked Coordinates:", coords.lon, coords.lat);
    
        const apiKey = "f9dc74471bf04fdda78a121a06481d0c";
        setNotifyLoad(true);
        try {
            const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${coords.lat}+${coords.lon}&key=${apiKey}`);
            const data = await res.json();
    
            if (data.results.length === 0) throw new Error("Reverse geocoding failed.");
    
            const components = data.results[0].components;
            console.log("Reverse Geocoded Components:", components);
    
            // Create the new location object
            const newLocation = {
                lat: coords.lat,
                lon: coords.lon,
                address: components.road || components.pedestrian || components.building || "",
                city: components.state || components._normalized_city || components.city || components.county || components.town || components.village || "",
                postcode: components.postcode || "",
                country: components.country || "",
            };
    
            setManualLocation(newLocation); // Set the manual location state
            
        } catch (err) {
            console.error("Failed to reverse geocode or update:", err);
        } finally
        {
            setNotifyLoad(false);
        }
    };
          
    const updateLocation = async (newLocation) => {
        if (!event_id) {
            console.error("Missing event_id for location update.");
            return;
        }
    
        console.log("Updating Location:", newLocation);
        setNotifyLoad(true);
    
        try {
            const res = await fetch(`${API_BASE_URL}/location/update-location`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                 "Authorization": `Bearer ${sessionStorage.getItem("token")}`
              },
              body: JSON.stringify({
                event_id,
                address: newLocation.address || "",
                city: newLocation.city || "",
                postcode: newLocation.postcode || "",
                country: newLocation.country || "",
                lat: newLocation.lat,
                lon: newLocation.lon,
              }),
            });
        
    
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to update location.");
            }
    
            notify("Location updated successfully.");
            await refetch(); // re-pull event data if needed
        } catch (error) {
            notify("Error updating location");
            setError("Failed to update location on the server.");
        } finally
        {
            setNotifyLoad(false);
        }
    };

    const FindPlace = async () =>
    {
        try {
            const coords = await geocodeAddress({ location: manualLocation });
            if (!coords) {
                return;
            }
    
            setLocation({ lat: coords.lat, lon: coords.lon }); // Update the map
        } catch (err) {
            console.error("Failed to submit manual location:", err);
        }
    };

    useEffect(() => {
        if (loading || !locationData || !locationData.location) return;

        const address = locationData.location?.address || locationData.location.city || locationData.location.postcode || locationData.location.country;

        if (locationData.location?.lat && locationData.location?.lon) {
            // If latitude and longitude are already available, set them directly
            console.log("Setting Location from API:", locationData.location.lat, locationData.location.lon);
            setLocation({ lat: locationData.location.lat, lon: locationData.location.lon });
            setManualLocation(locationData.location); // Set initial manual location
            setInitialLocation(locationData.location); // Store the initial state
        } else {
            if (address) {
                // Call geocodeAddress to get the latitude and longitude from the address
                geocodeAddress(locationData);
            } else {
                setLocation({ lat: 51.505, lon: -0.09 });
            }
        }
    }, [locationData, loading]); 


    if (error) return <PageError error={error?.message || "Something Went Wrong"} page={"Location"} />;
    if (loading) return <div className="loader"><p>Fetching Location</p><button onClick = {() => {navigate(`/event/${event_id}`)}} className="small-button">Cancel</button></div>;

    const isLocationEmpty = Object.entries(manualLocation)
        .filter(([key]) => key !== 'lat' && key !== 'lon')
        .every(([key, val]) => !String(val).trim()); 


    return (
        <div className="location">
            <div className="top-line">
                <button className="back-button" onClick={() => { goEventPage(); }}>
                    {theme === "dark" ? 
                        <img src="/svgs/back-arrow-white.svg" alt="Back" /> :
                    <img src="/svgs/back-arrow.svg" alt="Back" />}
                </button>
                <h2>Location</h2>
            </div>
            
            <div className="location-map section">
                {location && 
                    <MapComponent location={location} setLocation={role !== "attendee" ? setNewLocation : null} />
                }
            {/* Displaying Location Data */}
                <div className="location-details section">
                    <h3>Saved Location</h3>
                    <p><strong>Address:</strong> {locationData?.location?.address || "No address available"}</p>
                    <p><strong>City:</strong> {locationData?.location?.city || "No city available"}</p>
                    <p><strong>Postcode:</strong> {locationData?.location?.postcode || "No postcode available"}</p>
                    <p><strong>Country:</strong> {locationData?.location?.country || "No country available"}</p>
                </div>
            </div>

            {role != "attendee" && (
            <div className="location-manual-input section">
            <h3>Update Location</h3>
                <form className="manual-location-form">
                    <label>
                        Address:
                        <input
                            type="text"
                            name="address"
                            value={manualLocation.address}
                            onChange={handleManualInputChange}
                        />
                    </label>
                    <label>
                        City:
                        <input
                            type="text"
                            name="city"
                            value={manualLocation.city}
                            onChange={handleManualInputChange}
                        />
                    </label>
                    <label>
                        Postcode:
                        <input
                            type="text"
                            name="postcode"
                            value={manualLocation.postcode}
                            onChange={handleManualInputChange}
                        />
                    </label>
                    <div className="one-line-input">
                    <label>
                        Country:
                        <input
                            type="text"
                            name="country"
                            value={manualLocation.country}
                            onChange={handleManualInputChange}
                        />
                    </label>
                    
                    <div className="button-container">
                        <button className="small-button" type="button" onClick={cancelManualInput}>Cancel</button>
                        <button className="small-button" type="button" onClick={FindPlace}>Find</button>
                        <button className="small-button" type="button" onClick={submitManualLocation} disabled={isLocationEmpty || JSON.stringify(initialLocation) === JSON.stringify(manualLocation)}>Submit</button>
                    </div>
                    </div>
                </form>
            </div>
            )}
        </div>
    );
};


export default Location;
