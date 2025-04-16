import "../styles/profileSelector.css";
import { useEffect, useRef, useState } from "react";

export const Profiles = [
    { name: "Donkey", id: 0, path: "/svgs/animals/donkey.svg" },
    { name: "Cat", id: 1, path: "/svgs/animals/cat.svg" },
    { name: "Dog", id: 2, path: "/svgs/animals/dog.svg" },
    { name: "Bunny", id: 3, path: "/svgs/animals/bunny.svg" },
    { name: "Alein", id: 4, path: "/svgs/animals/alien.svg" },
    { name: "Bear", id: 5, path: "/svgs/animals/bear.svg" },
    { name: "Chicken", id: 6, path: "/svgs/animals/chicken.svg" },
    { name: "Fluffy Cat", id: 7, path: "/svgs/animals/fluffy.svg" },
    { name: "Polar Bear", id: 8, path: "/svgs/animals/polar-bear.svg" },
    { name: "Rabbit", id: 9, path: "/svgs/animals/rabbit.svg" },
    { name: "Rat", id: 10, path: "/svgs/animals/rat.svg" },
    { name: "Wolf", id: 11, path: "/svgs/animals/wolf.svg" },

];


const ProfileSelector = ({ index, onSelect }) => {
    const optionRef = useRef(null);
    const [optionWidth, setOptionWidth] = useState(0);

    useEffect(() => {
        if (optionRef.current) {
            const width = optionRef.current.offsetWidth;
            const margin = parseInt(getComputedStyle(optionRef.current).marginRight || 0);
            setOptionWidth(width + margin);
        }
    }, []);

    return (
        <div className="profile-selector">

            {Profiles.map((profile, i) => (
                <div
                    key={profile.id}
                    ref={i === 0 ? optionRef : null}
                    className={`profile-option ${i === index ? "selected" : ""}`}
                    onClick={() => onSelect(i)}
                >
                    <img
                        className="profile-selector-image"
                        src={profile.path}
                        alt={profile.name}
                    />
                </div>
            ))}
        </div>
    );
};

export default ProfileSelector;