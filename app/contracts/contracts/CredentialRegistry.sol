// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CredentialRegistry
 * @dev Smart contract for managing blockchain-verified credentials
 * @notice This contract allows authorized issuers to issue and revoke credentials on-chain
 */
contract CredentialRegistry is AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Credential structure
    struct Credential {
        bytes32 credentialHash;      // SHA-256 hash of the credential file
        address issuer;              // Address of the issuing organization
        address student;             // Address of the credential recipient
        uint256 issuedAt;           // Timestamp when credential was issued
        bool revoked;               // Revocation status
        string metadataURI;         // URI to credential metadata (IPFS or API)
    }

    // Mappings
    mapping(bytes32 => Credential) public credentials;
    mapping(bytes32 => bool) public credentialExists;
    mapping(address => uint256) public issuerCredentialCount;
    mapping(address => uint256) public studentCredentialCount;

    // Events
    event CredentialIssued(
        bytes32 indexed credentialHash,
        address indexed issuer,
        address indexed student,
        uint256 issuedAt,
        string metadataURI
    );

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 revokedAt
    );

    event IssuerAdded(address indexed issuer, address indexed admin);
    event IssuerRemoved(address indexed issuer, address indexed admin);

    /**
     * @dev Constructor - sets up roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Issue a new credential
     * @param _credentialHash SHA-256 hash of the credential file
     * @param _student Address of the credential recipient
     * @param _metadataURI URI to credential metadata
     */
    function issueCredential(
        bytes32 _credentialHash,
        address _student,
        string memory _metadataURI
    ) external onlyRole(ISSUER_ROLE) whenNotPaused nonReentrant {
        require(_credentialHash != bytes32(0), "Invalid credential hash");
        require(_student != address(0), "Invalid student address");
        require(!credentialExists[_credentialHash], "Credential already exists");
        require(bytes(_metadataURI).length > 0, "Metadata URI required");

        // Create credential
        credentials[_credentialHash] = Credential({
            credentialHash: _credentialHash,
            issuer: msg.sender,
            student: _student,
            issuedAt: block.timestamp,
            revoked: false,
            metadataURI: _metadataURI
        });

        credentialExists[_credentialHash] = true;
        issuerCredentialCount[msg.sender]++;
        studentCredentialCount[_student]++;

        emit CredentialIssued(
            _credentialHash,
            msg.sender,
            _student,
            block.timestamp,
            _metadataURI
        );
    }

    /**
     * @dev Revoke a credential
     * @param _credentialHash Hash of the credential to revoke
     */
    function revokeCredential(bytes32 _credentialHash)
        external
        onlyRole(ISSUER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(credentialExists[_credentialHash], "Credential does not exist");
        
        Credential storage credential = credentials[_credentialHash];
        require(credential.issuer == msg.sender, "Not the credential issuer");
        require(!credential.revoked, "Credential already revoked");

        credential.revoked = true;

        emit CredentialRevoked(_credentialHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify a credential
     * @param _credentialHash Hash of the credential to verify
     * @return exists Whether the credential exists
     * @return isRevoked Whether the credential is revoked
     * @return issuer Address of the issuer
     * @return student Address of the student
     */
    function verifyCredential(bytes32 _credentialHash)
        external
        view
        returns (
            bool exists,
            bool isRevoked,
            address issuer,
            address student
        )
    {
        if (!credentialExists[_credentialHash]) {
            return (false, false, address(0), address(0));
        }

        Credential memory credential = credentials[_credentialHash];
        return (
            true,
            credential.revoked,
            credential.issuer,
            credential.student
        );
    }

    /**
     * @dev Get full credential details
     * @param _credentialHash Hash of the credential
     * @return credential The credential struct
     */
    function getCredential(bytes32 _credentialHash)
        external
        view
        returns (Credential memory credential)
    {
        require(credentialExists[_credentialHash], "Credential does not exist");
        return credentials[_credentialHash];
    }

    /**
     * @dev Add an issuer (Admin only)
     * @param _issuer Address to grant issuer role
     */
    function addIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        require(_issuer != address(0), "Invalid issuer address");
        grantRole(ISSUER_ROLE, _issuer);
        emit IssuerAdded(_issuer, msg.sender);
    }

    /**
     * @dev Remove an issuer (Admin only)
     * @param _issuer Address to revoke issuer role
     */
    function removeIssuer(address _issuer) external onlyRole(ADMIN_ROLE) {
        require(_issuer != address(0), "Invalid issuer address");
        revokeRole(ISSUER_ROLE, _issuer);
        emit IssuerRemoved(_issuer, msg.sender);
    }

    /**
     * @dev Check if an address is an issuer
     * @param _address Address to check
     * @return bool Whether the address has issuer role
     */
    function isIssuer(address _address) external view returns (bool) {
        return hasRole(ISSUER_ROLE, _address);
    }

    /**
     * @dev Get issuer statistics
     * @param _issuer Address of the issuer
     * @return count Number of credentials issued
     */
    function getIssuerStats(address _issuer) external view returns (uint256 count) {
        return issuerCredentialCount[_issuer];
    }

    /**
     * @dev Get student statistics
     * @param _student Address of the student
     * @return count Number of credentials received
     */
    function getStudentStats(address _student) external view returns (uint256 count) {
        return studentCredentialCount[_student];
    }

    /**
     * @dev Pause the contract (Admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (Admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Batch issue credentials (gas optimization)
     * @param _credentialHashes Array of credential hashes
     * @param _students Array of student addresses
     * @param _metadataURIs Array of metadata URIs
     */
    function batchIssueCredentials(
        bytes32[] memory _credentialHashes,
        address[] memory _students,
        string[] memory _metadataURIs
    ) external onlyRole(ISSUER_ROLE) whenNotPaused nonReentrant {
        require(
            _credentialHashes.length == _students.length &&
            _students.length == _metadataURIs.length,
            "Array length mismatch"
        );
        require(_credentialHashes.length > 0, "Empty arrays");
        require(_credentialHashes.length <= 50, "Batch size too large");

        for (uint256 i = 0; i < _credentialHashes.length; i++) {
            bytes32 hash = _credentialHashes[i];
            address student = _students[i];
            string memory uri = _metadataURIs[i];

            require(hash != bytes32(0), "Invalid credential hash");
            require(student != address(0), "Invalid student address");
            require(!credentialExists[hash], "Credential already exists");
            require(bytes(uri).length > 0, "Metadata URI required");

            credentials[hash] = Credential({
                credentialHash: hash,
                issuer: msg.sender,
                student: student,
                issuedAt: block.timestamp,
                revoked: false,
                metadataURI: uri
            });

            credentialExists[hash] = true;
            issuerCredentialCount[msg.sender]++;
            studentCredentialCount[student]++;

            emit CredentialIssued(hash, msg.sender, student, block.timestamp, uri);
        }
    }
}
