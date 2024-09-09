import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, onClose, options }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                zIndex: 1000,
            }}
            className="bg-custom-dropdown rounded-box z-[999] w-36 p-1.5 shadow"
        >
            {options.map((option, index) => (
                <div
                    key={index}
                    className="py-1.5 px-4 text-sm cursor-pointer hover:bg-custom-text text-custom-text hover:text-black"
                    onClick={() => {
                        option.onClick();
                        onClose();
                    }}
                >
                    {option.label}
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;